/**
 * Notifies open SDK connections that a client's resolved theme (or its key) changed. Listeners re-read the
 * database, so a message only says "look again". In-process: one server instance sees every publish.
 */
export interface ThemeEvents {
  publish(clientIds: Iterable<string>): void;
  subscribe(clientId: string, listener: () => void): () => void;
}

export interface LiveLimits {
  maxPerKey: number;
  maxPerIp: number;
  heartbeatMs: number;
  /** Delays before re-running a failed database check; the last one repeats while the stream is open. */
  retryMs: number[];
}

export const LIVE_DEFAULTS: LiveLimits = { maxPerKey: 500, maxPerIp: 20, heartbeatMs: 25_000, retryMs: [2_000, 5_000, 15_000] };

export class ConnectionCounter {
  private readonly counts = new Map<string, number>();

  get(id: string): number {
    return this.counts.get(id) ?? 0;
  }

  add(id: string): void {
    this.counts.set(id, this.get(id) + 1);
  }

  remove(id: string): void {
    const n = this.get(id) - 1;
    if (n > 0) this.counts.set(id, n);
    else this.counts.delete(id);
  }
}

export class InProcessThemeEvents implements ThemeEvents {
  private readonly listeners = new Map<string, Set<() => void>>();

  publish(clientIds: Iterable<string>): void {
    for (const id of new Set(clientIds)) {
      for (const l of [...(this.listeners.get(id) ?? [])]) l();
    }
  }

  subscribe(clientId: string, listener: () => void): () => void {
    let set = this.listeners.get(clientId);
    if (!set) this.listeners.set(clientId, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0 && this.listeners.get(clientId) === set) this.listeners.delete(clientId);
    };
  }
}
