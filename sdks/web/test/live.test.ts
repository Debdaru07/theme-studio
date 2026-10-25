import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createThemeClient,
  memoryStorage,
  type EventSourceFactory,
  type EventSourceLike,
  type FetchLike,
  type LifecycleSignal,
  type WatchLifecycle,
} from '../src/index.ts';
import { acme, globex } from './fixtures.ts';

const ENDPOINT = 'http://localhost:8787';
const KEY = 'pk_demo_acme';

class FakeEventSource implements EventSourceLike {
  static instances: FakeEventSource[] = [];
  listeners = new Map<string, ((e: { data?: unknown }) => void)[]>();
  closed = false;
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, l: (e: { data?: unknown }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), l]);
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data?: unknown) {
    for (const l of this.listeners.get(type) ?? []) l({ data: data === undefined ? undefined : JSON.stringify(data) });
  }
  static get open() {
    return FakeEventSource.instances.filter((s) => !s.closed);
  }
}

function serving(...themes: (typeof acme)[]) {
  let i = 0;
  const fn = vi.fn<FetchLike>(async () => {
    const body = themes[Math.min(i++, themes.length - 1)]!;
    return { status: 200, ok: true, headers: { get: () => `"${body.meta?.hash}"` }, json: async () => body };
  });
  return fn;
}

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(v: DocumentVisibilityState) {
  visibility = v;
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeEventSource.instances = [];
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('client.watch()', () => {
  it('opens the events stream with the key and refreshes when the published hash changes', async () => {
    const fetch = serving(acme, globex);
    const client = createThemeClient({ endpoint: `${ENDPOINT}/`, key: KEY, storage: memoryStorage(), fetch });
    await client.load();
    const stop = client.watch({ eventSource: FakeEventSource });

    const es = FakeEventSource.instances[0]!;
    expect(es.url).toBe(`${ENDPOINT}/v1/theme/events?key=${KEY}`);

    es.emit('theme', { hash: acme.meta!.hash });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);

    es.emit('theme', { hash: globex.meta!.hash });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(client.current).toEqual(globex);

    stop();
    expect(es.closed).toBe(true);
  });

  it('closes the stream while the tab is hidden and reconnects and refreshes when visible again', async () => {
    const fetch = serving(acme);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch });
    await client.load();
    const stop = client.watch({ eventSource: FakeEventSource });
    expect(FakeEventSource.open).toHaveLength(1);

    setVisibility('hidden');
    expect(FakeEventSource.open).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetch).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    expect(FakeEventSource.open).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(250);
    expect(fetch).toHaveBeenCalledTimes(2);
    stop();
  });

  it('does not connect while hidden', () => {
    visibility = 'hidden';
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: serving(acme) });
    const stop = client.watch({ eventSource: FakeEventSource });
    expect(FakeEventSource.instances).toHaveLength(0);
    stop();
  });

  it('debounces focus, visibility and online refreshes', async () => {
    const fetch = serving(acme);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch });
    const stop = client.watch({ eventSource: null });
    window.dispatchEvent(new Event('focus'));
    setVisibility('visible');
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(249);
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(1);

    stop();
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to focus refresh when there is no EventSource', async () => {
    vi.stubGlobal('EventSource', undefined);
    const fetch = serving(acme);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch });
    const stop = client.watch();
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(250);
    expect(fetch).toHaveBeenCalledTimes(1);
    stop();
  });

  it('uses the global EventSource by default', () => {
    const native: EventSourceFactory | undefined = globalThis.EventSource;
    expect(['function', 'undefined']).toContain(typeof native);
    vi.stubGlobal('EventSource', FakeEventSource);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: serving(acme) });
    const stop = client.watch();
    expect(FakeEventSource.open).toHaveLength(1);
    stop();
    expect(FakeEventSource.open).toHaveLength(0);
  });

  it('reconnects with exponential backoff and resets it after an event', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch: serving(acme) });
    const stop = client.watch({ eventSource: FakeEventSource, minRetryMs: 1000, maxRetryMs: 4000 });

    FakeEventSource.instances[0]!.emit('error');
    expect(FakeEventSource.open).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(999);
    expect(FakeEventSource.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeEventSource.instances).toHaveLength(2);

    FakeEventSource.instances[1]!.emit('error');
    await vi.advanceTimersByTimeAsync(2000);
    expect(FakeEventSource.instances).toHaveLength(3);

    FakeEventSource.instances[2]!.emit('error');
    await vi.advanceTimersByTimeAsync(4000);
    FakeEventSource.instances[3]!.emit('error');
    await vi.advanceTimersByTimeAsync(4000);
    expect(FakeEventSource.instances).toHaveLength(5);

    FakeEventSource.instances[4]!.emit('theme', { hash: null });
    FakeEventSource.instances[4]!.emit('error');
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeEventSource.instances).toHaveLength(6);
    stop();
  });

  it('on a connection error, refreshes first and stops for good when the key is rejected (401)', async () => {
    let status = 200;
    const fetch = vi.fn<FetchLike>(async () => ({
      status,
      ok: status === 200,
      headers: { get: () => `"${acme.meta?.hash}"` },
      json: async () => acme,
    }));
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch });
    const stop = client.watch({ eventSource: FakeEventSource, minRetryMs: 1000 });

    FakeEventSource.instances[0]!.emit('error');
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeEventSource.instances).toHaveLength(2);

    status = 401;
    FakeEventSource.instances[1]!.emit('error');
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(client.error?.status).toBe(401);
    await vi.advanceTimersByTimeAsync(60_000);
    setVisibility('visible');
    window.dispatchEvent(new Event('focus'));
    expect(FakeEventSource.instances).toHaveLength(2);
    stop();
  });

  it('stops reconnecting once the key is revoked', async () => {
    const fetch = serving(acme);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch });
    const stop = client.watch({ eventSource: FakeEventSource });
    FakeEventSource.instances[0]!.emit('revoked', {});
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    setVisibility('visible');
    expect(FakeEventSource.instances).toHaveLength(1);
    stop();
  });

  it('accepts a custom lifecycle (React Native AppState)', async () => {
    let active = false;
    const listeners = new Set<(s: LifecycleSignal) => void>();
    const lifecycle: WatchLifecycle = {
      isVisible: () => active,
      subscribe: (l) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    };
    const signal = (s: LifecycleSignal) => {
      active = s !== 'hidden';
      for (const l of listeners) l(s);
    };
    const fetch = serving(acme);
    const client = createThemeClient({ endpoint: ENDPOINT, key: KEY, storage: memoryStorage(), fetch });
    const stop = client.watch({ eventSource: FakeEventSource, lifecycle });
    expect(FakeEventSource.instances).toHaveLength(0);

    signal('visible');
    expect(FakeEventSource.open).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(250);
    expect(fetch).toHaveBeenCalledTimes(1);

    signal('hidden');
    expect(FakeEventSource.open).toHaveLength(0);
    stop();
    expect(listeners.size).toBe(0);
  });
});
