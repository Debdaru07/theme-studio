import type { Breakpoint, Theme } from '@dts/schema';
import { parseHex, type ColorMode, type CubicBezier, type EasingName, type ElevationLevel } from '@dts/web/core';

type TextStyleName = keyof Theme['typography']['styles'];
type RadiusName = keyof Theme['shape']['radius'];
type FontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

/** Structurally compatible with RN's `TextStyle` (no runtime dependency on react-native). */
export interface RNTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
}

/** Structurally compatible with RN's `ViewStyle` shadow props (iOS) + `elevation` (Android). */
export interface RNShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface TextStyleOptions {
  /**
   * Map a family + weight to the name your app registered the font under, e.g. with
   * `@expo-google-fonts/*`: `(f, w) => \`${f.replace(/ /g, '')}_${w}\``. Android ignores `fontWeight`
   * for custom fonts, so a per-weight family name is usually needed there.
   */
  fontFamily?: (family: string, weight: number) => string;
}

const SCALED_STYLES: ReadonlySet<TextStyleName> = new Set(['display', 'headline']);
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * RN text style for a theme text style. `display`/`headline` are multiplied by
 * `typography.responsiveScale[breakpoint]` when a breakpoint is given.
 */
export function textStyle(theme: Theme, name: TextStyleName, breakpoint?: Breakpoint, options: TextStyleOptions = {}): RNTextStyle {
  const s = theme.typography.styles[name];
  const scale = breakpoint && SCALED_STYLES.has(name) ? theme.typography.responsiveScale[breakpoint] : 1;
  return {
    fontFamily: options.fontFamily ? options.fontFamily(s.family, s.weight) : s.family,
    fontSize: round1(s.size * scale),
    fontWeight: String(s.weight) as FontWeight,
    lineHeight: round1(s.lineHeight * scale),
    letterSpacing: s.letterSpacing,
  };
}

/** All 10 text styles at once (handy for `StyleSheet.create`). */
export function textStyles(theme: Theme, breakpoint?: Breakpoint, options?: TextStyleOptions): Record<TextStyleName, RNTextStyle> {
  const out = {} as Record<TextStyleName, RNTextStyle>;
  for (const name of Object.keys(theme.typography.styles) as TextStyleName[]) out[name] = textStyle(theme, name, breakpoint, options);
  return out;
}

/** Material 3 elevation in dp per level, used for Android's `elevation`. */
const ANDROID_ELEVATION = [0, 1, 3, 6, 8, 12] as const;

/**
 * iOS shadow props + Android `elevation` for an elevation level (0–5 or `level0`…`level5`).
 * The alpha of an 8-digit shadow color is folded into `shadowOpacity`; `shadowRadius` is blur / 2
 * (CSS blur radius ≈ 2σ, iOS shadowRadius ≈ σ).
 */
export function shadow(theme: Theme, level: number | ElevationLevel, mode: ColorMode): RNShadowStyle {
  const n = typeof level === 'number' ? level : Number(level.replace('level', ''));
  const idx = Math.min(5, Math.max(0, Math.round(n)));
  const s = theme.elevation.levels[`level${idx}` as ElevationLevel];
  const { r, g, b, a } = parseHex(theme.elevation.shadowColor[mode]);
  const hex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase();
  return {
    shadowColor: `#${hex(r)}${hex(g)}${hex(b)}`,
    shadowOffset: { width: 0, height: s.offsetY },
    shadowOpacity: Math.round(s.opacity * a * 1000) / 1000,
    shadowRadius: s.blur / 2,
    elevation: s.opacity === 0 ? 0 : (ANDROID_ELEVATION[idx] ?? 0),
  };
}

/** The 4 cubic-bezier control points of a theme easing. */
export function easing(theme: Theme, name: EasingName): CubicBezier {
  return theme.motion.easing[name];
}

/**
 * Build an easing function with RN's (or Reanimated's) `Easing`:
 * `easingFunction(theme, 'standard', Easing)` → `Easing.bezier(x1, y1, x2, y2)`.
 */
export function easingFunction<T>(theme: Theme, name: EasingName, Easing: { bezier(x1: number, y1: number, x2: number, y2: number): T }): T {
  const [x1, y1, x2, y2] = theme.motion.easing[name];
  return Easing.bezier(x1, y1, x2, y2);
}

export type NativeStackAnimation = 'fade' | 'slide_from_right' | 'fade_from_bottom' | 'none';

const PAGE_TRANSITION_TO_STACK: Record<Theme['motion']['pageTransition'], NativeStackAnimation> = {
  fade: 'fade',
  slide: 'slide_from_right',
  scale: 'fade_from_bottom',
  sharedAxis: 'slide_from_right',
  none: 'none',
};

/**
 * React Navigation native-stack `screenOptions` for the theme's page transition:
 * `<Stack.Navigator screenOptions={screenAnimation(theme)}>`.
 * `animationDuration` (ms, iOS) uses `motion.duration.medium`; `reducedMotion` forces `none`.
 */
export function screenAnimation(
  theme: Theme,
  options: { reducedMotion?: boolean } = {},
): { animation: NativeStackAnimation; animationDuration: number } {
  const reduced = Boolean(options.reducedMotion) && theme.motion.respectReducedMotion;
  const animation = reduced ? 'none' : PAGE_TRANSITION_TO_STACK[theme.motion.pageTransition];
  return { animation, animationDuration: animation === 'none' ? 0 : theme.motion.duration.medium };
}

/**
 * Corner radius honoring `shape.cornerStyle`. RN borders can't draw chamfered ("cut") corners,
 * so for `cut` themes the closest faithful rendering is a sharp corner (0) — except `full`,
 * which stays a pill. Pass `{ cut: 'radius' }` to get the raw radius regardless.
 */
export function radius(theme: Theme, name: RadiusName, options: { cut?: 'square' | 'radius' } = {}): number {
  const value = theme.shape.radius[name];
  if (theme.shape.cornerStyle !== 'cut' || name === 'full' || options.cut === 'radius') return value;
  return 0;
}
