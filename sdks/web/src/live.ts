/** The part of `EventSource` the live connection uses (browsers, or a polyfill such as `react-native-sse`). */
export interface EventSourceLike {
  addEventListener(type: string, listener: (event: object) => void): void;
  close(): void;
}

export type EventSourceFactory = new (url: string) => EventSourceLike;

/**
 * - `visible`: the app came to the foreground (connect and refresh)
 * - `hidden`: the app went to the background (disconnect)
 * - `focus`: the window regained focus or the network came back (refresh)
 */
export type LifecycleSignal = 'visible' | 'hidden' | 'focus';

export interface WatchLifecycle {
  isVisible(): boolean;
  subscribe(listener: (signal: LifecycleSignal) => void): () => void;
}

export interface WatchOptions {
  /** Defaults to `globalThis.EventSource`. `null` (or none available) keeps only the focus/visibility refresh. */
  eventSource?: EventSourceFactory | null;
  /** Defaults to `documentLifecycle()`. React Native passes an `AppState` lifecycle. */
  lifecycle?: WatchLifecycle;
  /** Debounce for focus/visibility refreshes. Default 250 ms. */
  debounceMs?: number;
  /** First reconnect delay. Default 1 s, doubling up to `maxRetryMs`. */
  minRetryMs?: number;
  /** Default 30 s. */
  maxRetryMs?: number;
}

/** Page visibility plus window `focus` and `online`. Without a `document`, always visible and silent. */
export function documentLifecycle(): WatchLifecycle {
  const doc = typeof document !== 'undefined' ? document : null;
  const win = typeof window !== 'undefined' ? window : null;
  return {
    isVisible: () => !doc || doc.visibilityState === 'visible',
    subscribe(listener) {
      const onVisibility = () => listener(doc!.visibilityState === 'visible' ? 'visible' : 'hidden');
      const onFocus = () => listener('focus');
      doc?.addEventListener('visibilitychange', onVisibility);
      win?.addEventListener('focus', onFocus);
      win?.addEventListener('online', onFocus);
      return () => {
        doc?.removeEventListener('visibilitychange', onVisibility);
        win?.removeEventListener('focus', onFocus);
        win?.removeEventListener('online', onFocus);
      };
    },
  };
}

export interface WatchTarget {
  url: string;
  refresh(): Promise<unknown>;
  currentHash(): string | null;
}

function eventHash(data: unknown): string | null {
  try {
    const hash = (JSON.parse(String(data)) as { hash?: unknown }).hash;
    return typeof hash === 'string' ? hash : null;
  } catch {
    return null;
  }
}

export function watchTheme(target: WatchTarget, options: WatchOptions = {}): () => void {
  const ES =
    options.eventSource === undefined
      ? ((globalThis as { EventSource?: EventSourceFactory }).EventSource ?? null)
      : options.eventSource;
  const lifecycle = options.lifecycle ?? documentLifecycle();
  const debounceMs = options.debounceMs ?? 250;
  const minRetryMs = options.minRetryMs ?? 1000;
  const maxRetryMs = options.maxRetryMs ?? 30_000;

  let source: EventSourceLike | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let stopped = false;
  let revoked = false;

  const sync = async (hash: string) => {
    await target.refresh();
    if (!stopped && target.currentHash() !== hash) await target.refresh();
  };

  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void target.refresh(), debounceMs);
  };

  const disconnect = () => {
    clearTimeout(retryTimer);
    retryTimer = undefined;
    source?.close();
    source = null;
  };

  const connect = () => {
    if (!ES || source || stopped || revoked || !lifecycle.isVisible()) return;
    clearTimeout(retryTimer);
    retryTimer = undefined;
    const es = new ES(target.url);
    source = es;
    es.addEventListener('theme', (event) => {
      if (source !== es) return;
      attempt = 0;
      const hash = eventHash((event as { data?: unknown }).data);
      if (hash && hash !== target.currentHash()) void sync(hash);
    });
    es.addEventListener('revoked', () => {
      if (source !== es) return;
      revoked = true;
      disconnect();
      void target.refresh();
    });
    es.addEventListener('error', () => {
      if (source !== es) return;
      disconnect();
      const delay = Math.min(maxRetryMs, minRetryMs * 2 ** attempt++);
      retryTimer = setTimeout(connect, delay / 2 + (Math.random() * delay) / 2);
    });
  };

  const unsubscribe = lifecycle.subscribe((signal) => {
    if (stopped) return;
    if (signal === 'hidden') {
      disconnect();
      return;
    }
    if (!source) {
      attempt = 0;
      connect();
    }
    scheduleRefresh();
  });
  connect();

  return () => {
    stopped = true;
    unsubscribe();
    disconnect();
    clearTimeout(refreshTimer);
  };
}
