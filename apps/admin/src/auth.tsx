import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, responseCache, tokenStore, wakeApi, type User } from './api.ts';

interface AuthState {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // A returning user renders at once from the cached profile; /me confirms it in the background.
  const [user, setUser] = useState<User | null>(() => (tokenStore.get() ? (responseCache.read<User>('me') ?? null) : null));
  const [loading, setLoading] = useState(() => !!tokenStore.get() && !responseCache.read<User>('me'));

  useEffect(() => {
    wakeApi();
    if (!tokenStore.get()) return;
    api<{ user: User }>('/me')
      .then((r) => {
        setUser(r.user);
        responseCache.write('me', r.user);
      })
      .catch((e) => {
        // Only a rejected token signs out; a sleeping or unreachable API keeps the cached session.
        if (e?.status === 401) {
          tokenStore.set(null);
          responseCache.clear();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => {
      responseCache.clear();
      setUser(null);
    };
    window.addEventListener('dts:logout', onLogout);
    return () => window.removeEventListener('dts:logout', onLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(r.token);
    responseCache.write('me', r.user);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    responseCache.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
