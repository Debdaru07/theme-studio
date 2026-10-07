import type { Theme } from '@debdaru07/schema';
import { DEFAULT_THEME } from './default-theme.ts';

/** Minimal key/value storage; sync (localStorage) or async (React Native AsyncStorage). */
export interface ThemeStorage {
  getItem(key: string): string | null | undefined | Promise<string | null | undefined>;
  setItem(key: string, value: string): void | Promise<void>;
}

export type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string> }) => Promise<{
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}>;

export interface ThemeClientOptions {
  /** API origin, e.g. `http://localhost:8787`. `/v1/theme` is appended. */
  endpoint: string;
  /** Publishable key (`pk_…`), sent as `X-Theme-Key`. */
  key: string;
  /** Cache storage. Defaults to a safe `localStorage` wrapper (no-op without `window`). */
  storage?: ThemeStorage;
  /** Custom fetch (tests, RN polyfills). Defaults to `globalThis.fetch`. */
  fetch?: FetchLike;
  /** Theme used when there is neither cache nor network. Defaults to the bundled platform default. */
  fallback?: Theme;
  /** Storage key. Defaults to `dts:theme:<key>` so different clients never share a cache. */
  storageKey?: string;
}

/**
 * - `idle`: nothing loaded yet (current = fallback)
 * - `loading`: request in flight (current = cache or fallback)
 * - `ready`: confirmed by the server (200 or 304)
 * - `error`: the last request failed (current = cache or fallback; see `error`)
 */
export type ThemeStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ThemeSource = 'fallback' | 'cache' | 'network';

export interface ThemeSnapshot {
  theme: Theme;
  status: ThemeStatus;
  source: ThemeSource;
  error: ThemeFetchError | null;
}

export interface ThemeClient {
  readonly current: Theme;
  readonly status: ThemeStatus;
  readonly source: ThemeSource;
  readonly error: ThemeFetchError | null;
  /** Immutable snapshot; a new object on every change (for `useSyncExternalStore`). */
  getSnapshot(): ThemeSnapshot;
  /** Cache first, then network. Never rejects; resolves with the best available theme. */
  load(): Promise<Theme>;
  /** Network only (conditional on the last ETag). Never rejects. */
  refresh(): Promise<Theme>;
  /** Called on every theme/status change. Returns an unsubscribe function. */
  subscribe(listener: (snapshot: ThemeSnapshot) => void): () => void;
}

export class ThemeFetchError extends Error {
  /** HTTP status, or 0 for network/parse errors. */
  readonly status: number;
  constructor(message: string, status: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ThemeFetchError';
    this.status = status;
  }
}

interface CacheEntry {
  etag: string | null;
  theme: Theme;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

/** In-memory storage (tests, SSR, or opting out of persistence). */
export function memoryStorage(initial: Record<string, string> = {}): ThemeStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
  };
}

/** `localStorage` wrapper that never throws (private mode, quota, SSR). */
export function localStorageAdapter(): ThemeStorage {
  const ls = (): Storage | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
    } catch {
      return null;
    }
  };
  return {
    getItem(k) {
      try {
        return ls()?.getItem(k) ?? null;
      } catch {
        return null;
      }
    },
    setItem(k, v) {
      try {
        ls()?.setItem(k, v);
      } catch {
        /* quota exceeded / disabled storage: caching is best-effort */
      }
    },
  };
}

function isTheme(value: unknown): value is Theme {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Theme>;
  return v.schemaVersion === 1 && !!v.color?.light && !!v.color?.dark && !!v.typography && !!v.spacing;
}

const themeId = (t: Theme) => t.meta?.hash ?? null;

// ── Client ───────────────────────────────────────────────────────────────────

export function createThemeClient(options: ThemeClientOptions): ThemeClient {
  const storage = options.storage ?? localStorageAdapter();
  const storageKey = options.storageKey ?? `dts:theme:${options.key}`;
  const url = `${options.endpoint.replace(/\/+$/, '')}/v1/theme`;
  const fallback = options.fallback ?? DEFAULT_THEME;

  let snapshot: ThemeSnapshot = { theme: fallback, status: 'idle', source: 'fallback', error: null };
  let etag: string | null = null;
  let cacheRead: Promise<void> | null = null;
  let inflight: Promise<Theme> | null = null;
  const listeners = new Set<(s: ThemeSnapshot) => void>();

  const update = (patch: Partial<ThemeSnapshot>) => {
    const next = { ...snapshot, ...patch };
    if (
      next.theme === snapshot.theme &&
      next.status === snapshot.status &&
      next.source === snapshot.source &&
      next.error === snapshot.error
    ) {
      return;
    }
    snapshot = next;
    for (const l of [...listeners]) l(snapshot);
  };

  const readCache = (): Promise<void> => {
    cacheRead ??= (async () => {
      try {
        const raw = await storage.getItem(storageKey);
        if (!raw) return;
        const entry = JSON.parse(raw) as Partial<CacheEntry>;
        if (!isTheme(entry.theme)) return;
        // Never let a stale cache overwrite a theme that already came from the network.
        if (snapshot.source === 'network') return;
        etag = entry.etag ?? null;
        update({ theme: entry.theme, source: 'cache' });
      } catch {
        /* corrupt cache: ignore */
      }
    })();
    return cacheRead;
  };

  const writeCache = async (entry: CacheEntry) => {
    try {
      await storage.setItem(storageKey, JSON.stringify(entry));
    } catch {
      /* best-effort */
    }
  };

  const fetchImpl = (): FetchLike => {
    if (options.fetch) return options.fetch;
    if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis) as unknown as FetchLike;
    throw new ThemeFetchError('No fetch implementation available', 0);
  };

  const refresh = (): Promise<Theme> => {
    inflight ??= (async () => {
      update({ status: 'loading' });
      try {
        const headers: Record<string, string> = { 'X-Theme-Key': options.key, Accept: 'application/json' };
        if (etag && snapshot.source !== 'fallback') headers['If-None-Match'] = etag;
        const res = await fetchImpl()(url, { method: 'GET', headers });

        if (res.status === 304) {
          update({ status: 'ready', error: null });
          return snapshot.theme;
        }
        if (!res.ok) {
          const reason =
            res.status === 401 ? 'Invalid theme key' : res.status === 404 ? 'No published theme' : `HTTP ${res.status}`;
          throw new ThemeFetchError(`${reason} (GET ${url})`, res.status);
        }
        let body: unknown;
        try {
          body = await res.json();
        } catch (cause) {
          throw new ThemeFetchError('Theme response is not valid JSON', 0, { cause });
        }
        if (!isTheme(body)) throw new ThemeFetchError('Theme response is not a resolved v1 theme', 0);

        etag = res.headers.get('ETag') ?? res.headers.get('etag') ?? (body.meta?.hash ? `"${body.meta.hash}"` : null);
        const changed = snapshot.source === 'fallback' || themeId(body) === null || themeId(body) !== themeId(snapshot.theme);
        update({ theme: changed ? body : snapshot.theme, source: 'network', status: 'ready', error: null });
        await writeCache({ etag, theme: snapshot.theme });
        return snapshot.theme;
      } catch (err) {
        const error =
          err instanceof ThemeFetchError ? err : new ThemeFetchError(err instanceof Error ? err.message : String(err), 0, { cause: err });
        update({ status: 'error', error });
        return snapshot.theme;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  };

  return {
    get current() {
      return snapshot.theme;
    },
    get status() {
      return snapshot.status;
    },
    get source() {
      return snapshot.source;
    },
    get error() {
      return snapshot.error;
    },
    getSnapshot: () => snapshot,
    async load() {
      update({ status: 'loading' });
      await readCache();
      return refresh();
    },
    refresh,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
