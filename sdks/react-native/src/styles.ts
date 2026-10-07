import type { Breakpoint, Theme } from '@debdaru07/schema';
import {
  componentTokens,
  parseHex,
  roleColor,
  type ButtonSize,
  type ButtonVariantName,
  type ColorMode,
  type CubicBezier,
  type EasingName,
  type ElevationLevel,
} from '@debdaru07/web/core';

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
  fontStyle: 'normal' | 'italic';
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
  fontFamily?: (family: string, weight: number, italic: boolean) => string;
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
  const italic = !!s.italic; // missing in themes cached before `italic` existed
  return {
    fontFamily: options.fontFamily ? options.fontFamily(s.family, s.weight, italic) : s.family,
    fontSize: round1(s.size * scale),
    fontWeight: String(s.weight) as FontWeight,
    lineHeight: round1(s.lineHeight * scale),
    letterSpacing: s.letterSpacing,
    fontStyle: italic ? 'italic' : 'normal',
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

// ── Component styles ─────────────────────────────────────────────────────────
// Pure helpers that turn the theme's component tuning tokens into RN style objects. Tuning is always read through
// `componentTokens(theme)`, so themes published before component tuning existed get the same defaults the server uses.

/** Corner radius in px honoring `shape.cornerStyle`: `cut` themes render square corners (RN can't chamfer), pills stay pills. */
export function cornerRadius(theme: Theme, value: number): number {
  return theme.shape.cornerStyle === 'cut' && value < theme.shape.radius.full ? 0 : value;
}

const withAlpha = (hex: string, a: number) => `${hex.slice(0, 7)}${Math.round(a * 255).toString(16).padStart(2, '0')}`;

/** Structurally compatible with RN's `ViewStyle` (the subset these helpers produce). */
export interface RNBoxStyle extends Partial<RNShadowStyle> {
  minHeight?: number;
  minWidth?: number;
  height?: number;
  padding?: number;
  paddingHorizontal?: number;
  gap?: number;
  borderRadius: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderWidth: number;
  borderBottomWidth?: number;
  borderColor: string;
  backgroundColor: string;
  overflow?: 'hidden' | 'visible';
}

/** RN text style plus color (and the button text transform). */
export interface RNLabelStyle extends RNTextStyle {
  color: string;
  textTransform?: 'none' | 'uppercase' | 'capitalize';
}

export interface ButtonStyleOptions {
  /** Defaults to the theme's `components.button.variant`. */
  variant?: ButtonVariantName;
  /** Defaults to `md`. */
  size?: ButtonSize;
  mode: ColorMode;
  /** Disabled/loading look: 12% on-surface container, disabled content, no border or shadow. */
  disabled?: boolean;
}

/** Container + label styles for a button size × variant. `container.gap` is the icon gap. */
export function buttonStyles(theme: Theme, options: ButtonStyleOptions): { container: RNBoxStyle; label: RNLabelStyle } {
  const b = componentTokens(theme).button;
  const scheme = theme.color[options.mode];
  const size = b.sizes[options.size ?? 'md'];
  const v = b.variants[options.variant ?? b.variant];
  const off = Boolean(options.disabled);
  const border = off ? 'transparent' : v.border;
  return {
    container: {
      minHeight: size.height,
      // Text buttons sit inline with copy, so they keep a tighter inset than the size's padding (same as web).
      paddingHorizontal: (options.variant ?? b.variant) === 'text' ? theme.spacing.scale.md : size.paddingX,
      gap: b.iconGap,
      borderRadius: cornerRadius(theme, b.radius),
      borderWidth: border === 'transparent' ? 0 : b.borderWidth,
      borderColor: roleColor(scheme, border),
      backgroundColor: off ? withAlpha(scheme.onSurface, 0.12) : roleColor(scheme, v.container),
      ...shadow(theme, off ? 0 : v.elevation, options.mode),
    },
    label: {
      ...textStyle(theme, size.textStyle),
      color: off ? scheme.onSurfaceDisabled : roleColor(scheme, v.content),
      textTransform: b.textTransform,
    },
  };
}

export type InputState = 'default' | 'focused' | 'error' | 'disabled';

export interface InputStyleOptions {
  /** Defaults to the theme's `components.input.variant`. */
  variant?: 'outlined' | 'filled';
  mode: ColorMode;
  state?: InputState;
}

/**
 * Text field styles: `wrapper` (label / field / help column, `gap` = labelGap), `field` (the box), `label`, `text`
 * (the input itself). Focus and error thicken the border to at least `shape.borderWidth.thick`.
 */
export function inputStyles(
  theme: Theme,
  options: InputStyleOptions,
): { wrapper: { gap: number; opacity: number }; field: RNBoxStyle; label: RNLabelStyle; text: RNLabelStyle } {
  const i = componentTokens(theme).input;
  const scheme = theme.color[options.mode];
  const state = options.state ?? 'default';
  const filled = (options.variant ?? i.variant) === 'filled';
  const r = cornerRadius(theme, i.radius);
  const emphasized = state === 'focused' || state === 'error';
  const width = emphasized ? Math.max(i.borderWidth, theme.shape.borderWidth.thick) : i.borderWidth;
  return {
    wrapper: { gap: i.labelGap, opacity: state === 'disabled' ? theme.effects.opacity.disabled : 1 },
    field: {
      minHeight: i.height,
      paddingHorizontal: i.paddingX,
      borderRadius: r,
      borderBottomLeftRadius: filled ? 0 : r,
      borderBottomRightRadius: filled ? 0 : r,
      borderWidth: filled ? 0 : width,
      borderBottomWidth: width,
      borderColor: state === 'error' ? scheme.error : state === 'focused' ? scheme.primary : scheme.outline,
      backgroundColor: filled ? scheme.surfaceContainerHigh : 'transparent',
    },
    label: { ...textStyle(theme, 'labelMedium'), color: scheme.onSurface },
    text: { ...textStyle(theme, 'bodyLarge'), color: scheme.onSurface },
  };
}

/** Chip container (height, paddingX, radius, `gap` = iconGap) + label; selected colors come from `chip.selected` roles. */
export function chipStyles(theme: Theme, options: { selected?: boolean; mode: ColorMode }): { container: RNBoxStyle; label: RNLabelStyle } {
  const c = componentTokens(theme).chip;
  const scheme = theme.color[options.mode];
  const selected = Boolean(options.selected);
  return {
    container: {
      minHeight: c.height,
      paddingHorizontal: c.paddingX,
      gap: c.iconGap,
      borderRadius: cornerRadius(theme, c.radius),
      borderWidth: selected ? 0 : theme.shape.borderWidth.thin,
      borderColor: selected ? 'transparent' : scheme.outline,
      backgroundColor: selected ? roleColor(scheme, c.selected.container) : 'transparent',
    },
    label: { ...textStyle(theme, 'labelLarge'), color: selected ? roleColor(scheme, c.selected.content) : scheme.onSurface },
  };
}

export type CardVariant = 'elevated' | 'outlined' | 'filled';

/** Card surface: padding, gap, radius, elevation shadow (elevated), border (outlined, or elevated + `card.bordered`). */
export function cardStyle(theme: Theme, mode: ColorMode, variant: CardVariant = 'elevated'): RNBoxStyle {
  const c = componentTokens(theme).card;
  const scheme = theme.color[mode];
  const bordered = variant === 'outlined' || (variant === 'elevated' && c.bordered);
  return {
    padding: c.padding,
    gap: c.gap,
    borderRadius: cornerRadius(theme, c.radius),
    overflow: 'hidden',
    backgroundColor: variant === 'filled' ? scheme.surfaceContainerHigh : scheme.surface,
    borderWidth: bordered ? theme.shape.borderWidth.thin : 0,
    borderColor: bordered ? scheme.outlineMuted : 'transparent',
    ...shadow(theme, variant === 'elevated' ? c.elevation : 0, mode),
  };
}

/** Dialog surface (padding, radius, elevation) + action row (`gap` = actionGap). */
export function dialogStyles(
  theme: Theme,
  mode: ColorMode,
): { container: RNBoxStyle; actions: { flexDirection: 'row'; flexWrap: 'wrap'; justifyContent: 'flex-end'; gap: number } } {
  const d = componentTokens(theme).dialog;
  return {
    container: {
      padding: d.padding,
      gap: theme.spacing.scale.lg,
      borderRadius: cornerRadius(theme, d.radius),
      borderWidth: 0,
      borderColor: 'transparent',
      backgroundColor: theme.color[mode].surfaceContainerHigh,
      ...shadow(theme, d.elevation, mode),
    },
    actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: d.actionGap },
  };
}

/** Count badge pill: 18px tall, `badge.paddingX`, badge radius, error color. Its text color is `onError`. */
export function badgeStyle(theme: Theme, mode: ColorMode): RNBoxStyle {
  const b = componentTokens(theme).badge;
  return {
    minWidth: 18,
    height: 18,
    paddingHorizontal: b.paddingX,
    borderRadius: cornerRadius(theme, b.radius),
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: theme.color[mode].error,
  };
}
