import type { Breakpoint, ColorRole, Theme } from '@dts/schema';
import { type ColorMode, type ElevationLevel, cubicBezierCss, rgba } from './tokens.ts';

// ── Naming ───────────────────────────────────────────────────────────────────

export const CSS_VAR_PREFIX = '--dts-';

type SpaceKey = keyof Theme['spacing']['scale'];
type RadiusKey = keyof Theme['shape']['radius'];
type TextStyleName = keyof Theme['typography']['styles'];
type TextProp = 'family' | 'size' | 'weight' | 'lineHeight' | 'letterSpacing';

/** Every CSS variable `toCssVariables` emits, as a dot path (`color.onPrimary` → `--dts-color-on-primary`). */
export type CssVarPath =
  | `color.${ColorRole}`
  | `space.${SpaceKey}`
  | `radius.${RadiusKey}`
  | 'cornerStyle'
  | `border.${keyof Theme['shape']['borderWidth']}`
  | `font.${keyof Theme['typography']['fontFamily']}`
  | `text.${TextStyleName}.${TextProp}`
  | `shadow.${ElevationLevel}`
  | `duration.${keyof Theme['motion']['duration']}`
  | `easing.${keyof Theme['motion']['easing']}`
  | `z.${keyof Theme['elevation']['zIndex']}`
  | `opacity.${keyof Theme['effects']['opacity']}`
  | `focusRing.${keyof Theme['effects']['focusRing']}`
  | `blur.${keyof Theme['effects']['blur']}`
  | `controlHeight.${keyof Theme['sizing']['controlHeight']}`
  | `icon.${keyof Theme['sizing']['icon']}`
  | 'minTouchTarget'
  | 'appBar.height'
  | 'button.radius'
  | 'button.height'
  | 'button.paddingX'
  | 'button.textTransform'
  | 'input.radius'
  | 'input.height'
  | 'card.radius'
  | 'card.shadow'
  | 'card.border'
  | 'card.padding'
  | 'dialog.radius'
  | 'dialog.shadow'
  | 'dialog.padding'
  | 'chip.radius'
  | 'badge.radius'
  | 'listGap'
  | 'formGap'
  | 'pagePadding'
  | 'sectionGap'
  | 'cardGap'
  | 'contentMaxWidth'
  | 'gradient.brand';

/** `onPrimaryContainer` → `on-primary-container`, `paddingX` → `padding-x`, `2xl` → `2xl`. */
export function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
}

/** `cssVarName('color.onPrimary')` → `--dts-color-on-primary`. */
export function cssVarName(path: CssVarPath): string {
  return CSS_VAR_PREFIX + path.split('.').map(kebab).join('-');
}

/** `cssVar('color.primary')` → `var(--dts-color-primary)`; optional CSS fallback value. */
export function cssVar(path: CssVarPath, fallback?: string): string {
  return fallback === undefined ? `var(${cssVarName(path)})` : `var(${cssVarName(path)}, ${fallback})`;
}

// ── Values ───────────────────────────────────────────────────────────────────

/** Always `<n>px` (also for 0) so values stay valid inside `calc()`. */
const px = (n: number) => `${n}px`;

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  '-apple-system',
  'blinkmacsystemfont',
]);

/** CSS `font-family` stack: quoted family + generic fallback. */
export function fontStack(family: string, kind: 'sans' | 'mono' = 'sans'): string {
  const head = GENERIC_FAMILIES.has(family.toLowerCase()) ? family : `"${family.replace(/"/g, '')}"`;
  return kind === 'mono' ? `${head}, ui-monospace, monospace` : `${head}, system-ui, sans-serif`;
}

/** Full `box-shadow` value for an elevation level in a mode (`none` for transparent shadows). */
export function boxShadow(theme: Theme, level: ElevationLevel | number, mode: ColorMode): string {
  const key = (typeof level === 'number' ? `level${level}` : level) as ElevationLevel;
  const s = theme.elevation.levels[key];
  if (!s || s.opacity === 0) return 'none';
  return `0 ${px(s.offsetY)} ${px(s.blur)} ${px(s.spread)} ${rgba(theme.elevation.shadowColor[mode], s.opacity)}`;
}

export function brandGradient(theme: Theme, mode: ColorMode): string | null {
  const g = theme.effects.gradient;
  if (!g.enabled) return null;
  const scheme = theme.color[mode];
  return `linear-gradient(${g.angle}deg, ${g.stops.map((role) => scheme[role]).join(', ')})`;
}

/** Layout vars (`page-padding`, `section-gap`, `card-gap`, `content-max-width`) for one breakpoint. */
export function layoutVariables(theme: Theme, breakpoint: Breakpoint): Record<string, string> {
  const l = theme.spacing.layout[breakpoint];
  return {
    [cssVarName('pagePadding')]: px(l.pagePadding),
    [cssVarName('sectionGap')]: px(l.sectionGap),
    [cssVarName('cardGap')]: px(l.cardGap),
    [cssVarName('contentMaxWidth')]: l.contentMaxWidth === null ? 'none' : px(l.contentMaxWidth),
  };
}

/** Variables that depend on the color mode (colors, shadows, gradient, card border). */
export function modeVariables(theme: Theme, mode: ColorMode): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (path: CssVarPath, value: string) => {
    out[cssVarName(path)] = value;
  };
  const scheme = theme.color[mode];
  for (const role of Object.keys(scheme) as ColorRole[]) set(`color.${role}`, scheme[role]);
  for (const level of Object.keys(theme.elevation.levels) as ElevationLevel[]) {
    set(`shadow.${level}`, boxShadow(theme, level, mode));
  }
  set('card.shadow', boxShadow(theme, theme.components.card.elevation, mode));
  set('dialog.shadow', boxShadow(theme, theme.components.dialog.elevation, mode));
  const gradient = brandGradient(theme, mode);
  if (gradient) set('gradient.brand', gradient);
  return out;
}

/** Variables that depend on neither mode nor breakpoint. */
export function staticVariables(theme: Theme): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (path: CssVarPath, value: string | number) => {
    out[cssVarName(path)] = String(value);
  };
  const t = theme;

  for (const [k, v] of Object.entries(t.spacing.scale)) set(`space.${k as SpaceKey}`, px(v));
  for (const [k, v] of Object.entries(t.shape.radius)) set(`radius.${k as RadiusKey}`, px(v));
  set('cornerStyle', t.shape.cornerStyle);
  set('border.thin', px(t.shape.borderWidth.thin));
  set('border.thick', px(t.shape.borderWidth.thick));

  const ff = t.typography.fontFamily;
  set('font.primary', fontStack(ff.primary));
  set('font.secondary', fontStack(ff.secondary));
  set('font.mono', fontStack(ff.mono, 'mono'));
  for (const [name, s] of Object.entries(t.typography.styles) as [TextStyleName, Theme['typography']['styles'][TextStyleName]][]) {
    set(`text.${name}.family`, fontStack(s.family, s.family === ff.mono ? 'mono' : 'sans'));
    set(`text.${name}.size`, px(s.size));
    set(`text.${name}.weight`, s.weight);
    set(`text.${name}.lineHeight`, px(s.lineHeight));
    set(`text.${name}.letterSpacing`, px(s.letterSpacing));
  }

  for (const [k, v] of Object.entries(t.motion.duration)) set(`duration.${k as keyof Theme['motion']['duration']}`, `${v}ms`);
  for (const [k, v] of Object.entries(t.motion.easing)) {
    set(`easing.${k as keyof Theme['motion']['easing']}`, cubicBezierCss(v));
  }
  for (const [k, v] of Object.entries(t.elevation.zIndex)) set(`z.${k as keyof Theme['elevation']['zIndex']}`, v);
  for (const [k, v] of Object.entries(t.effects.opacity)) set(`opacity.${k as keyof Theme['effects']['opacity']}`, v);
  set('focusRing.width', px(t.effects.focusRing.width));
  set('focusRing.offset', px(t.effects.focusRing.offset));
  set('blur.sm', px(t.effects.blur.sm));
  set('blur.md', px(t.effects.blur.md));
  for (const [k, v] of Object.entries(t.sizing.controlHeight)) {
    set(`controlHeight.${k as keyof Theme['sizing']['controlHeight']}`, px(v));
  }
  for (const [k, v] of Object.entries(t.sizing.icon)) set(`icon.${k as keyof Theme['sizing']['icon']}`, px(v));
  set('minTouchTarget', px(t.sizing.minTouchTarget));
  set('appBar.height', px(t.navigation.appBar.height));

  const c = t.components;
  set('button.radius', px(c.button.radius));
  set('button.height', px(c.button.height));
  set('button.paddingX', px(c.button.paddingX));
  set('button.textTransform', c.button.textTransform);
  set('input.radius', px(c.input.radius));
  set('input.height', px(c.input.height));
  set('card.radius', px(c.card.radius));
  set('card.border', c.card.bordered ? `${px(t.shape.borderWidth.thin)} solid ${cssVar('color.outlineMuted')}` : 'none');
  set('dialog.radius', px(c.dialog.radius));
  set('chip.radius', px(c.chip.radius));
  set('badge.radius', px(c.badge.radius));

  const sc = t.spacing.component;
  set('card.padding', px(sc.cardPadding));
  set('dialog.padding', px(sc.dialogPadding));
  set('listGap', px(sc.listGap));
  set('formGap', px(sc.formGap));
  return out;
}

/**
 * All CSS custom properties for a theme in one mode, with layout vars for one breakpoint
 * (default `mobile`). Keys are full property names (`--dts-color-primary`).
 */
export function toCssVariables(theme: Theme, mode: ColorMode, breakpoint: Breakpoint = 'mobile'): Record<string, string> {
  return { ...staticVariables(theme), ...modeVariables(theme, mode), ...layoutVariables(theme, breakpoint) };
}

const block = (selector: string, vars: Record<string, string>) =>
  `${selector} {\n${Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')}\n}`;

/**
 * CSS text for SSR / static use:
 * - `selector` gets all light-mode vars + mobile layout vars,
 * - `selector[data-dts-mode="dark"]` overrides the mode-dependent vars,
 * - `@media (min-width: …)` blocks switch the layout vars per breakpoint.
 */
export function themeStylesheet(theme: Theme, selector = ':root'): string {
  const sel = (suffix: string) =>
    selector
      .split(',')
      .map((s) => `${s.trim()}${suffix}`)
      .join(', ');
  const parts = [
    block(selector, { 'color-scheme': 'light', ...toCssVariables(theme, 'light', 'mobile') }),
    block(sel('[data-dts-mode="dark"]'), { 'color-scheme': 'dark', ...modeVariables(theme, 'dark') }),
  ];
  const bps = theme.sizing.breakpoints;
  for (const bp of ['tablet', 'desktop', 'wide'] as const) {
    parts.push(`@media (min-width: ${bps[bp]}px) {\n${block(selector, layoutVariables(theme, bp)).replace(/^/gm, '  ')}\n}`);
  }
  return parts.join('\n\n') + '\n';
}
