import type { Breakpoint, Theme } from '@dts/schema';
import { toCssVariables } from './css.ts';
import { loadGoogleFonts } from './fonts.ts';
import { type ColorMode, type ModePreference, breakpointFor } from './tokens.ts';

export interface AppliedThemeState {
  /** Resolved mode (never `system`). */
  mode: ColorMode;
  breakpoint: Breakpoint;
  /** Width used to pick the breakpoint (`null` when the breakpoint is fixed). */
  width: number | null;
}

export interface ApplyThemeOptions {
  /** Element that receives the vars + attributes. Default `document.documentElement`. */
  root?: HTMLElement;
  /** Default `system` (follows `prefers-color-scheme`). */
  mode?: ModePreference;
  /**
   * Breakpoint for layout vars. `auto` (default) measures the root element with a `ResizeObserver`
   * (or the window width when the root is `<html>` / ResizeObserver is unavailable).
   */
  breakpoint?: Breakpoint | 'auto';
  /** Inject Google Fonts `<link>`s for the theme families. Default `true`. */
  loadFonts?: boolean;
  /** Called immediately and whenever the resolved mode or breakpoint changes. */
  onChange?: (state: AppliedThemeState) => void;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Write a theme onto an element as CSS custom properties and keep it in sync with
 * the color scheme and the element's width. Returns a dispose function that removes
 * every property/attribute it set and detaches all listeners.
 */
export function applyTheme(theme: Theme, options: ApplyThemeOptions = {}): () => void {
  const root = options.root ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!root) return () => {};
  const win = root.ownerDocument?.defaultView ?? (typeof window !== 'undefined' ? window : undefined);
  const pref = options.mode ?? 'system';
  const bpOption = options.breakpoint ?? 'auto';
  const isDocumentRoot = root === root.ownerDocument?.documentElement;

  const written = new Set<string>();
  const cleanups: (() => void)[] = [];
  let state: AppliedThemeState | null = null;

  const mql = pref === 'system' && win?.matchMedia ? win.matchMedia(DARK_QUERY) : null;
  const resolveMode = (): ColorMode => (pref === 'system' ? (mql?.matches ? 'dark' : 'light') : pref);

  const measure = (): number => {
    if (!isDocumentRoot) {
      const w = root.getBoundingClientRect().width || root.clientWidth;
      if (w > 0 || !win) return w;
    }
    return win?.innerWidth ?? 0;
  };
  let width: number | null = bpOption === 'auto' ? measure() : null;

  const write = () => {
    const mode = resolveMode();
    const breakpoint = bpOption === 'auto' ? breakpointFor(width ?? 0, theme) : bpOption;
    const vars = toCssVariables(theme, mode, breakpoint);
    for (const name of written) if (!(name in vars)) root.style.removeProperty(name);
    written.clear();
    for (const [name, value] of Object.entries(vars)) {
      if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value);
      written.add(name);
    }
    root.style.setProperty('color-scheme', mode);
    root.setAttribute('data-dts-mode', mode);
    root.setAttribute('data-dts-breakpoint', breakpoint);
    if (!state || state.mode !== mode || state.breakpoint !== breakpoint || state.width !== width) {
      state = { mode, breakpoint, width };
      options.onChange?.(state);
    }
  };

  write();
  if (options.loadFonts !== false) loadGoogleFonts(theme, root.ownerDocument ?? undefined);

  if (mql) {
    const onScheme = () => write();
    if (mql.addEventListener) {
      mql.addEventListener('change', onScheme);
      cleanups.push(() => mql.removeEventListener('change', onScheme));
    } else {
      mql.addListener?.(onScheme);
      cleanups.push(() => mql.removeListener?.(onScheme));
    }
  }

  if (bpOption === 'auto') {
    const RO = (win as (Window & { ResizeObserver?: typeof ResizeObserver }) | undefined)?.ResizeObserver ?? globalThis.ResizeObserver;
    if (!isDocumentRoot && RO) {
      const ro = new RO((entries) => {
        const entry = entries[entries.length - 1];
        // Border-box width: a preview frame's outer width is what a device viewport would be.
        const w = entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.contentRect?.width ?? measure();
        if (w === width) return;
        width = w;
        write();
      });
      ro.observe(root);
      cleanups.push(() => ro.disconnect());
    } else if (win) {
      const onResize = () => {
        const w = measure();
        if (w === width) return;
        width = w;
        write();
      };
      win.addEventListener('resize', onResize);
      cleanups.push(() => win.removeEventListener('resize', onResize));
    }
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    for (const c of cleanups) c();
    for (const name of written) root.style.removeProperty(name);
    root.style.removeProperty('color-scheme');
    root.removeAttribute('data-dts-mode');
    root.removeAttribute('data-dts-breakpoint');
  };
}
