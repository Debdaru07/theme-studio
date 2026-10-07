import {
  createContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { Breakpoint, ColorScheme, Theme } from '@debdaru07/schema';
import {
  applyTheme,
  breakpointFor,
  DEFAULT_THEME,
  type AppliedThemeState,
  type ColorMode,
  type ModePreference,
  type ThemeClient,
  type ThemeFetchError,
  type ThemeSnapshot,
  type ThemeSource,
  type ThemeStatus,
} from '@debdaru07/web';

export interface ThemeContextValue {
  theme: Theme;
  /** Resolved mode (never `system`). */
  mode: ColorMode;
  /** `theme.color[mode]`. */
  colors: ColorScheme;
  /** Viewport breakpoint (`scope="root"`) or container breakpoint (`scope="element"`). */
  breakpoint: Breakpoint;
  status: ThemeStatus;
  source: ThemeSource | 'prop';
  error: ThemeFetchError | null;
  client: ThemeClient | null;
  /** The element carrying the CSS variables (`null` before mount). */
  rootElement: HTMLElement | null;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = 'DtsThemeContext';

export interface ThemeProviderProps {
  /** Theme client from `createThemeClient` (`@debdaru07/web`). Loaded on mount unless `autoLoad={false}`. */
  client?: ThemeClient;
  /** Explicit theme (e.g. an admin draft). Takes precedence over `client`. */
  theme?: Theme;
  /** Used when there is neither `theme` nor `client`. Defaults to the bundled platform default. */
  fallback?: Theme;
  /** Default `system` (follows `prefers-color-scheme`). */
  mode?: ModePreference;
  /** `root` writes vars on `<html>`; `element` renders a wrapper `<div>` and scopes vars to it. Default `root`. */
  scope?: 'root' | 'element';
  /** Default `auto`: viewport width for `root`, the wrapper's width for `element`. */
  breakpoint?: Breakpoint | 'auto';
  /** Inject Google Fonts links. Default `true`. */
  loadFonts?: boolean;
  /** Call `client.load()` on mount. Default `true`. */
  autoLoad?: boolean;
  /** Wrapper props (`scope="element"` only). */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const noopSubscribe = () => () => {};
const DARK_QUERY = '(prefers-color-scheme: dark)';

function initialState(pref: ModePreference, bp: Breakpoint | 'auto', theme: Theme): AppliedThemeState {
  const hasWindow = typeof window !== 'undefined';
  const mode: ColorMode =
    pref !== 'system' ? pref : hasWindow && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
  if (bp !== 'auto') return { mode, breakpoint: bp, width: null };
  const width = hasWindow ? window.innerWidth : 0;
  return { mode, breakpoint: breakpointFor(width, theme), width };
}

export function ThemeProvider(props: ThemeProviderProps) {
  const {
    client,
    theme: themeProp,
    fallback = DEFAULT_THEME,
    mode: modePref = 'system',
    scope = 'root',
    breakpoint: bpOption = 'auto',
    loadFonts = true,
    autoLoad = true,
    className,
    style,
    children,
  } = props;

  const snapshot: ThemeSnapshot | null = useSyncExternalStore(
    client ? client.subscribe : noopSubscribe,
    () => client?.getSnapshot() ?? null,
    () => client?.getSnapshot() ?? null,
  );

  useEffect(() => {
    if (client && autoLoad && client.status === 'idle') void client.load();
  }, [client, autoLoad]);

  const theme = themeProp ?? snapshot?.theme ?? fallback;
  const ref = useRef<HTMLDivElement>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [applied, setApplied] = useState<AppliedThemeState>(() => initialState(modePref, bpOption, theme));

  useIsoLayoutEffect(() => {
    const root = scope === 'element' ? ref.current : document.documentElement;
    if (!root) return;
    setRootElement(root);
    return applyTheme(theme, {
      root,
      mode: modePref,
      breakpoint: bpOption,
      loadFonts,
      onChange: (next) =>
        setApplied((prev) => (prev.mode === next.mode && prev.breakpoint === next.breakpoint ? prev : next)),
    });
  }, [theme, modePref, bpOption, scope, loadFonts]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode: applied.mode,
      colors: theme.color[applied.mode],
      breakpoint: applied.breakpoint,
      status: themeProp ? 'ready' : (snapshot?.status ?? 'ready'),
      source: themeProp ? 'prop' : (snapshot?.source ?? 'fallback'),
      error: themeProp ? null : (snapshot?.error ?? null),
      client: client ?? null,
      rootElement,
    }),
    [theme, applied, themeProp, snapshot, client, rootElement],
  );

  return (
    <ThemeContext.Provider value={value}>
      {scope === 'element' ? (
        <div ref={ref} className={className} style={style} data-dts-scope="">
          {children}
        </div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
}
