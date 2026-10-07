import type { ContrastReport, Theme, ThemeInput, ThemeIssue } from '@debdaru07/schema';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

const TOKEN_KEY = 'dts.admin.token';

export const tokenStore = {
  get: () => safe(() => localStorage.getItem(TOKEN_KEY)),
  set: (t: string | null) => safe(() => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))),
};

const CACHE_PREFIX = 'dts.admin.cache.';

/**
 * Last-known API responses, so returning users see their data at once while the free-tier API wakes (up to a
 * minute). Shown as stale data and replaced as soon as the network answers. Cleared on sign-out.
 */
export const responseCache = {
  read<T>(key: string): T | undefined {
    const raw = safe(() => localStorage.getItem(CACHE_PREFIX + key));
    return raw ? (safe(() => JSON.parse(raw) as T) ?? undefined) : undefined;
  },
  write(key: string, value: unknown) {
    safe(() => localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value)));
  },
  clear() {
    safe(() => Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX)).forEach((k) => localStorage.removeItem(k)));
  },
};

/** React Query options for a GET that renders from the cache first, then always revalidates. */
export function cachedGet<T>(key: string, path: string) {
  return {
    queryFn: async () => {
      const data = await api<T>(path);
      responseCache.write(key, data);
      return data;
    },
    initialData: () => responseCache.read<T>(key),
    initialDataUpdatedAt: 0,
  };
}

let woke = false;
/** Free hosting sleeps when idle: start waking the API as early as possible, once per page load. */
export function wakeApi() {
  if (woke) return;
  woke = true;
  void fetch(`${API_URL}/health`).catch(() => {});
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: { issues?: ThemeIssue[]; details?: { contrast?: ContrastReport } } = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      tokenStore.set(null);
      window.dispatchEvent(new Event('dts:logout'));
    }
    throw new ApiError(res.status, body.error ?? res.statusText, body);
  }
  return body as T;
}

// ── Types mirrored from the server ───────────────────────────────────────────

export type Role = 'platform_admin' | 'tenant_admin' | 'client_editor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string | null;
  clientId: string | null;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
}

export interface VersionSummary {
  version: number;
  hash: string;
  note: string | null;
  publishedAt: string;
  publishedBy: string | null;
}

export interface Client {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  publishableKey: string;
  published?: VersionSummary | null;
  /** Client list only: seed colors and primary font (draft over published over the agency base). */
  brand?: { primary: string | null; secondary: string | null; accent: string | null; font: string | null };
}

export interface ThemeState {
  draft: ThemeInput;
  /** Client themes only: the tenant's published base layer. */
  base?: ThemeInput;
  draftUpdatedAt: string | null;
  published: VersionSummary | null;
  publishedLayer: ThemeInput | null;
  hasUnpublishedChanges: boolean;
  client?: Client;
  tenant?: Tenant;
}

export interface Version extends VersionSummary {
  layer: ThemeInput;
  resolved: Theme;
}
