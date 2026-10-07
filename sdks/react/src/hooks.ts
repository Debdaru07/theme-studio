import { useContext, useMemo, useSyncExternalStore } from 'react';
import type { Breakpoint, Theme } from '@debdaru07/schema';
import { getToken, motionTokens, type MotionTokens, type TokenPath, type TokenValue } from '@debdaru07/web';
import { ThemeContext, type ThemeContextValue } from './ThemeProvider.tsx';

/** Theme, resolved mode, current-mode colors, breakpoint and load status. Must be inside `<ThemeProvider>`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used inside <ThemeProvider> from @debdaru07/react');
  return ctx;
}

/** Token by dot path; `color.*` resolves against the current mode (`useToken('color.primary')`). */
export function useToken<P extends TokenPath>(path: P): TokenValue<P> {
  const { theme, mode } = useTheme();
  return getToken(theme, mode, path);
}

/** Current breakpoint: the viewport's, or the scoped element's when `scope="element"`. */
export function useBreakpoint(): Breakpoint {
  return useTheme().breakpoint;
}

/** Navigation pattern for the current breakpoint (`navigation.pattern[breakpoint]`). */
export function useNavigationPattern(): Theme['navigation']['pattern'][Breakpoint] {
  const { theme, breakpoint } = useTheme();
  return theme.navigation.pattern[breakpoint];
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(REDUCED_QUERY);
  mql.addEventListener?.('change', onChange);
  return () => mql.removeEventListener?.('change', onChange);
}

/** `prefers-reduced-motion: reduce` (false on the server). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(REDUCED_QUERY).matches : false),
    () => false,
  );
}

/**
 * Durations (ms), easings (raw + CSS) and page transition. When the user prefers reduced motion
 * and the theme has `respectReducedMotion`, durations are 0 and the transition is `none`.
 */
export function useMotion(): MotionTokens {
  const { theme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  return useMemo(() => motionTokens(theme, { prefersReducedMotion }), [theme, prefersReducedMotion]);
}
