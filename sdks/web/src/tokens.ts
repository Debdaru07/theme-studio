import type { Breakpoint, ColorRole, ColorScheme, Theme } from '@debdaru07/schema';

export type ColorMode = 'light' | 'dark';
export type ModePreference = ColorMode | 'system';
export type EasingName = keyof Theme['motion']['easing'];
export type DurationName = keyof Theme['motion']['duration'];
export type ElevationLevel = keyof Theme['elevation']['levels'];
export type CubicBezier = readonly [number, number, number, number];

// ── Typed token paths ────────────────────────────────────────────────────────

type Paths<T> = T extends readonly unknown[]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]:
          | K
          | (T[K] extends readonly unknown[] ? never : T[K] extends object ? `${K}.${Paths<T[K]>}` : never);
      }[keyof T & string]
    : never;

type PathValue<T, P extends string> = P extends `${infer H}.${infer R}`
  ? H extends keyof T
    ? PathValue<T[H], R>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Dot path into a theme. `color.<role>` addresses the color of the *current mode*;
 * every other path addresses the resolved theme object directly (e.g. `spacing.scale.md`).
 */
export type TokenPath = `color.${ColorRole}` | Paths<Omit<Theme, 'color' | 'meta' | 'schemaVersion'>>;

export type TokenValue<P extends string> = P extends `color.${string}`
  ? string
  : PathValue<Omit<Theme, 'color' | 'meta' | 'schemaVersion'>, P>;

/** Read a token by dot path. `color.*` resolves against `theme.color[mode]`. */
export function getToken<P extends TokenPath>(theme: Theme, mode: ColorMode, path: P): TokenValue<P>;
export function getToken(theme: Theme, mode: ColorMode, path: string): unknown;
export function getToken(theme: Theme, mode: ColorMode, path: string): unknown {
  const parts = path.split('.');
  let node: unknown = theme;
  if (parts[0] === 'color' && parts[1] !== 'light' && parts[1] !== 'dark') {
    node = theme.color[mode];
    parts.shift();
  }
  for (const part of parts) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

// ── Breakpoints ──────────────────────────────────────────────────────────────

/** Breakpoint for a viewport/container width (min-width thresholds from `sizing.breakpoints`). */
export function breakpointFor(width: number, theme: Theme): Breakpoint {
  const bp = theme.sizing.breakpoints;
  if (width >= bp.wide) return 'wide';
  if (width >= bp.desktop) return 'desktop';
  if (width >= bp.tablet) return 'tablet';
  return 'mobile';
}

export function colorsFor(theme: Theme, mode: ColorMode): ColorScheme {
  return theme.color[mode];
}

// ── Color helpers ────────────────────────────────────────────────────────────

/** Parse `#RRGGBB` / `#RRGGBBAA` into channels (alpha 0..1). */
export function parseHex(hex: string): { r: number; g: number; b: number; a: number } {
  const h = hex.replace('#', '');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length >= 8 ? n(6) / 255 : 1 };
}

const round = (v: number, digits = 3) => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

/** `rgba()` string for a hex color with an extra opacity multiplier. */
export function rgba(hex: string, opacity = 1): string {
  const { r, g, b, a } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${round(a * opacity)})`;
}

// ── Motion ───────────────────────────────────────────────────────────────────

export function cubicBezierCss(curve: CubicBezier): string {
  return `cubic-bezier(${curve.join(', ')})`;
}

export interface MotionTokens {
  /** Durations in ms (0 when reduced motion is in effect). */
  duration: Theme['motion']['duration'];
  /** Raw bezier control points. */
  easing: Theme['motion']['easing'];
  /** CSS `cubic-bezier(...)` strings. */
  easingCss: Record<EasingName, string>;
  /** `none` when reduced motion is in effect. */
  pageTransition: Theme['motion']['pageTransition'];
  /** True when the user asked for reduced motion AND the theme respects it. */
  reduced: boolean;
}

/** Motion tokens with `prefers-reduced-motion` applied when the theme opts in. */
export function motionTokens(theme: Theme, opts: { prefersReducedMotion?: boolean } = {}): MotionTokens {
  const m = theme.motion;
  const reduced = Boolean(opts.prefersReducedMotion) && m.respectReducedMotion;
  return {
    duration: reduced ? { short: 0, medium: 0, long: 0 } : { ...m.duration },
    easing: m.easing,
    easingCss: {
      standard: cubicBezierCss(m.easing.standard),
      emphasized: cubicBezierCss(m.easing.emphasized),
      decelerate: cubicBezierCss(m.easing.decelerate),
      accelerate: cubicBezierCss(m.easing.accelerate),
    },
    pageTransition: reduced ? 'none' : m.pageTransition,
    reduced,
  };
}

export function navigationPattern(theme: Theme, breakpoint: Breakpoint): Theme['navigation']['pattern'][Breakpoint] {
  return theme.navigation.pattern[breakpoint];
}
