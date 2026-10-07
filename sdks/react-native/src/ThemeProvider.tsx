import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme, useWindowDimensions } from 'react-native';
import type { Breakpoint, ColorScheme, Theme } from '@debdaru07/schema';
import {
  breakpointFor,
  DEFAULT_THEME,
  getToken,
  motionTokens,
  type TokenPath,
  type TokenValue,
  type ColorMode,
  type ModePreference,
  type MotionTokens,
  type ThemeClient,
  type ThemeFetchError,
  type ThemeSnapshot,
  type ThemeSource,
  type ThemeStatus,
} from '@debdaru07/web/core';

export interface NativeThemeContextValue {
  theme: Theme;
  /** Resolved mode (never `system`). */
  mode: ColorMode;
  /** `theme.color[mode]` — hex strings ready for `StyleSheet`. */
  colors: ColorScheme;
  /** From `useWindowDimensions().width`. */
  breakpoint: Breakpoint;
  status: ThemeStatus;
  source: ThemeSource | 'prop';
  error: ThemeFetchError | null;
  client: ThemeClient | null;
}

export const ThemeContext = createContext<NativeThemeContextValue | null>(null);
ThemeContext.displayName = 'DtsNativeThemeContext';

export interface ThemeProviderProps {
  /** Theme client (`createThemeClient` with an AsyncStorage adapter). Loaded on mount unless `autoLoad={false}`. */
  client?: ThemeClient;
  /** Explicit theme; takes precedence over `client`. */
  theme?: Theme;
  /** Used when there is neither `theme` nor `client`. Defaults to the bundled platform default. */
  fallback?: Theme;
  /** Default `system` (`useColorScheme()`). */
  mode?: ModePreference;
  /** Call `client.load()` on mount. Default `true`. */
  autoLoad?: boolean;
  children?: ReactNode;
}

const noopSubscribe = () => () => {};

export function ThemeProvider({ client, theme: themeProp, fallback = DEFAULT_THEME, mode = 'system', autoLoad = true, children }: ThemeProviderProps) {
  const snapshot: ThemeSnapshot | null = useSyncExternalStore(
    client ? client.subscribe : noopSubscribe,
    () => client?.getSnapshot() ?? null,
    () => client?.getSnapshot() ?? null,
  );

  useEffect(() => {
    if (client && autoLoad && client.status === 'idle') void client.load();
  }, [client, autoLoad]);

  const system = useColorScheme();
  const { width } = useWindowDimensions();
  const theme = themeProp ?? snapshot?.theme ?? fallback;
  const resolvedMode: ColorMode = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const breakpoint = breakpointFor(width, theme);

  const value = useMemo<NativeThemeContextValue>(
    () => ({
      theme,
      mode: resolvedMode,
      colors: theme.color[resolvedMode],
      breakpoint,
      status: themeProp ? 'ready' : (snapshot?.status ?? 'ready'),
      source: themeProp ? 'prop' : (snapshot?.source ?? 'fallback'),
      error: themeProp ? null : (snapshot?.error ?? null),
      client: client ?? null,
    }),
    [theme, resolvedMode, breakpoint, themeProp, snapshot, client],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Theme, resolved mode, current-mode colors, breakpoint and status. Must be inside `<ThemeProvider>`. */
export function useTheme(): NativeThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used inside <ThemeProvider> from @debdaru07/react-native');
  return ctx;
}

/** Token by dot path; `color.*` resolves against the current mode. */
export function useToken<P extends TokenPath>(path: P): TokenValue<P> {
  const { theme, mode } = useTheme();
  return getToken(theme, mode, path);
}

export function useBreakpoint(): Breakpoint {
  return useTheme().breakpoint;
}

/** `navigation.pattern[breakpoint]` — pick a React Navigation navigator (tabs / drawer / …) with it. */
export function useNavigationPattern(): Theme['navigation']['pattern'][Breakpoint] {
  const { theme, breakpoint } = useTheme();
  return theme.navigation.pattern[breakpoint];
}

/** OS "reduce motion" setting (AccessibilityInfo). `false` until the first async read resolves. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v: boolean) => setReduced(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

/** Durations/easings/page transition, zeroed when reduce-motion is on and the theme respects it. */
export function useMotion(): MotionTokens {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  return useMemo(() => motionTokens(theme, { prefersReducedMotion }), [theme, prefersReducedMotion]);
}
