import { describe, expect, it, vi } from 'vitest';
import { createThemeClient, DEFAULT_THEME, memoryStorage, type FetchLike, type ThemeSnapshot } from '../src/index.ts';
import { acme, globex } from './fixtures.ts';

const ENDPOINT = 'http://localhost:8787';
const KEY = 'pk_demo_acme';
const STORAGE_KEY = `dts:theme:${KEY}`;

type Reply = { status: number; body?: unknown; etag?: string } | Error;

function mockFetch(...replies: Reply[]) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fn = vi.fn<FetchLike>(async (url, init) => {
    calls.push({ url, headers: init?.headers ?? {} });
    const r = replies.shift() ?? { status: 500 };
    if (r instanceof Error) throw r;
    return {
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      headers: { get: (n: string) => (n.toLowerCase() === 'etag' ? (r.etag ?? null) : null) },
      json: async () => r.body,
    };
  });
  return { fn, calls };
}

const cached = (theme = acme, etag = '"fixture-acme-v1"') => memoryStorage({ [STORAGE_KEY]: JSON.stringify({ etag, theme }) });

describe('createThemeClient', () => {
  it('starts with the bundled default theme', () => {
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: mockFetch().fn });
    expect(client.current).toBe(DEFAULT_THEME);
    expect(client.status).toBe('idle');
    expect(client.source).toBe('fallback');
  });

  it('200: fetches, sends the key, caches with the ETag and notifies', async () => {
    const { fn, calls } = mockFetch({ status: 200, body: acme, etag: '"fixture-acme-v1"' });
    const storage = memoryStorage();
    const client = createThemeClient({ endpoint: `${ENDPOINT}/`, key: KEY, storage, fetch: fn });
    const seen: ThemeSnapshot[] = [];
    client.subscribe((s) => seen.push(s));

    const theme = await client.load();

    expect(theme).toEqual(acme);
    expect(calls[0]?.url).toBe(`${ENDPOINT}/v1/theme`);
    expect(calls[0]?.headers['X-Theme-Key']).toBe(KEY);
    expect(calls[0]?.headers['If-None-Match']).toBeUndefined();
    expect(client.status).toBe('ready');
    expect(client.source).toBe('network');
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual({ etag: '"fixture-acme-v1"', theme: acme });
    expect(seen.map((s) => s.status)).toEqual(['loading', 'ready']);
    expect(client.getSnapshot()).toBe(seen.at(-1));
    expect(seen.at(-1)?.theme).toEqual(acme);
  });

  it('serves the cache instantly, then revalidates with If-None-Match (304)', async () => {
    const { fn, calls } = mockFetch({ status: 304 });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: cached(), fetch: fn });
    const themes: string[] = [];
    client.subscribe((s) => themes.push(`${s.source}:${s.status}`));

    const theme = await client.load();

    expect(theme).toEqual(acme);
    expect(calls[0]?.headers['If-None-Match']).toBe('"fixture-acme-v1"');
    expect(client.status).toBe('ready');
    expect(client.source).toBe('cache');
    expect(themes).toEqual(['fallback:loading', 'cache:loading', 'cache:ready']);
  });

  it('replaces a stale cache when the server sends a new theme', async () => {
    const { fn } = mockFetch({ status: 200, body: globex, etag: '"fixture-globex-v1"' });
    const storage = cached();
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage, fetch: fn });
    const seen: string[] = [];
    client.subscribe((s) => seen.push(s.theme.assets.appName));
    await client.load();
    expect(client.current.assets.appName).toBe('Globex Care');
    expect(seen).toContain('Acme Fleet'); // cache shown first
    expect(seen.at(-1)).toBe('Globex Care');
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).etag).toBe('"fixture-globex-v1"');
  });

  it('keeps the same theme object when the hash is unchanged', async () => {
    const { fn } = mockFetch({ status: 200, body: structuredClone(acme), etag: '"x"' });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: cached(), fetch: fn });
    const seen: unknown[] = [];
    client.subscribe((s) => seen.push(s.theme));
    await client.load();
    expect(client.source).toBe('network');
    // Every notification carried the very same (cached) object: no needless re-render.
    expect(new Set(seen.filter((t) => t !== DEFAULT_THEME)).size).toBe(1);
    expect(client.current).toBe(seen.at(-1));
  });

  it('network error: keeps the cache and reports the error', async () => {
    const { fn } = mockFetch(new TypeError('Failed to fetch'));
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: cached(), fetch: fn });
    const theme = await client.load();
    expect(theme).toEqual(acme);
    expect(client.status).toBe('error');
    expect(client.source).toBe('cache');
    expect(client.error?.status).toBe(0);
    expect(client.error?.message).toContain('Failed to fetch');
  });

  it('no cache + error: falls back to the bundled default', async () => {
    const { fn } = mockFetch({ status: 500 });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: fn });
    expect(await client.load()).toBe(DEFAULT_THEME);
    expect(client.source).toBe('fallback');
    expect(client.status).toBe('error');
  });

  it('uses a custom fallback theme', async () => {
    const { fn } = mockFetch({ status: 404 });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: fn, fallback: globex });
    expect(await client.load()).toBe(globex);
    expect(client.error?.status).toBe(404);
    expect(client.error?.message).toContain('No published theme');
  });

  it('401: reports an invalid key and keeps the current theme', async () => {
    const { fn } = mockFetch({ status: 401, body: { error: 'invalid key' } });
    const client = createThemeClient({ endpoint: ENDPOINT, key: 'pk_bad', storage: memoryStorage(), fetch: fn });
    await client.load();
    expect(client.status).toBe('error');
    expect(client.error?.status).toBe(401);
    expect(client.error?.name).toBe('ThemeFetchError');
    expect(client.current).toBe(DEFAULT_THEME);
  });

  it('rejects malformed bodies without touching the cache', async () => {
    const { fn } = mockFetch({ status: 200, body: { hello: 'world' } });
    const storage = cached();
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage, fetch: fn });
    await client.load();
    expect(client.current).toEqual(acme);
    expect(client.status).toBe('error');
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).theme).toEqual(acme);
  });

  it('ignores corrupt cache entries', async () => {
    const { fn } = mockFetch({ status: 200, body: acme, etag: '"e"' });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage({ [STORAGE_KEY]: '{not json' }), fetch: fn });
    expect(await client.load()).toEqual(acme);
  });

  it('works with async storage (AsyncStorage-like)', async () => {
    const data = new Map([[STORAGE_KEY, JSON.stringify({ etag: '"e"', theme: globex })]]);
    const storage = {
      getItem: async (k: string) => data.get(k) ?? null,
      setItem: async (k: string, v: string) => void data.set(k, v),
    };
    const { fn, calls } = mockFetch({ status: 304 });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage, fetch: fn });
    expect(await client.load()).toEqual(globex);
    expect(calls[0]?.headers['If-None-Match']).toBe('"e"');
  });

  it('refresh() after a 200 sends the new ETag; concurrent calls are deduped', async () => {
    const { fn, calls } = mockFetch({ status: 200, body: acme, etag: '"v1"' }, { status: 304 });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: fn });
    await Promise.all([client.load(), client.refresh()]);
    expect(fn).toHaveBeenCalledTimes(1);
    await client.refresh();
    expect(calls[1]?.headers['If-None-Match']).toBe('"v1"');
    expect(client.status).toBe('ready');
  });

  it('unsubscribe stops notifications', async () => {
    const { fn } = mockFetch({ status: 200, body: acme, etag: '"v1"' });
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: fn });
    const listener = vi.fn();
    const off = client.subscribe(listener);
    off();
    await client.load();
    expect(listener).not.toHaveBeenCalled();
  });

  it('default localStorage adapter persists between clients', async () => {
    localStorage.clear();
    const { fn } = mockFetch({ status: 200, body: acme, etag: '"v1"' });
    await createThemeClient({ endpoint: ENDPOINT, key: KEY, fetch: fn }).load();
    const { fn: offline } = mockFetch(new TypeError('offline'));
    const second = createThemeClient({ endpoint: ENDPOINT, key: KEY, fetch: offline });
    expect(await second.load()).toEqual(acme);
    expect(second.source).toBe('cache');
  });
});
