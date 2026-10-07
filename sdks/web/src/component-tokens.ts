import type { ColorRole, ColorScheme, Theme } from '@debdaru07/schema';

export type ComponentTokens = Theme['components'];
export type ButtonSize = keyof ComponentTokens['button']['sizes'];
export type ButtonVariantName = keyof ComponentTokens['button']['variants'];
export type ButtonVariantStyle = ComponentTokens['button']['variants'][ButtonVariantName];

/** Shapes of themes published before component tuning existed (any field may be missing). */
type Loose<T> = { [K in keyof T]?: T[K] extends object ? Loose<T[K]> : T[K] };

const DEFAULT_VARIANTS: ComponentTokens['button']['variants'] = {
  filled: { container: 'primary', content: 'onPrimary', border: 'transparent', elevation: 0 },
  tonal: { container: 'secondaryContainer', content: 'onSecondaryContainer', border: 'transparent', elevation: 0 },
  outlined: { container: 'transparent', content: 'primary', border: 'outline', elevation: 0 },
  text: { container: 'transparent', content: 'primary', border: 'transparent', elevation: 0 },
  danger: { container: 'error', content: 'onError', border: 'transparent', elevation: 0 },
};

/**
 * Complete component tokens for any theme. Themes resolved by a current server already carry every value; themes
 * published before component tuning (or cached by an older SDK) get the same defaults the server would derive,
 * computed from that theme's own tokens. Safe to call on every render (it only reads).
 */
export function componentTokens(theme: Theme): ComponentTokens {
  const c = theme.components as Loose<ComponentTokens>;
  const s = theme.spacing.scale;
  const h = theme.sizing.controlHeight;
  const thin = theme.shape.borderWidth.thin;
  const b = c.button ?? {};
  const md = { height: b.height ?? h.md, paddingX: b.paddingX ?? s.xl };

  const variants = Object.fromEntries(
    (Object.keys(DEFAULT_VARIANTS) as ButtonVariantName[]).map((v) => [v, { ...DEFAULT_VARIANTS[v], ...b.variants?.[v] }]),
  ) as ComponentTokens['button']['variants'];

  return {
    button: {
      variant: b.variant ?? 'filled',
      radius: b.radius ?? theme.shape.radius.full,
      height: md.height,
      paddingX: md.paddingX,
      textTransform: b.textTransform ?? 'none',
      borderWidth: b.borderWidth ?? thin,
      iconGap: b.iconGap ?? s.sm,
      sizes: {
        sm: { height: h.sm, paddingX: s.md, textStyle: 'labelMedium', ...b.sizes?.sm },
        md: { ...md, textStyle: 'labelLarge', ...b.sizes?.md },
        lg: { height: h.lg, paddingX: s['2xl'], textStyle: 'labelLarge', ...b.sizes?.lg },
      },
      variants,
    },
    input: {
      variant: c.input?.variant ?? 'outlined',
      radius: c.input?.radius ?? theme.shape.radius.sm,
      height: c.input?.height ?? h.lg,
      borderWidth: c.input?.borderWidth ?? thin,
      paddingX: c.input?.paddingX ?? s.md,
      labelGap: c.input?.labelGap ?? s.xs,
    },
    card: {
      radius: c.card?.radius ?? theme.shape.radius.md,
      elevation: c.card?.elevation ?? 1,
      bordered: c.card?.bordered ?? false,
      padding: c.card?.padding ?? theme.spacing.component.cardPadding,
      gap: c.card?.gap ?? s.sm,
    },
    dialog: {
      radius: c.dialog?.radius ?? theme.shape.radius.xl,
      elevation: c.dialog?.elevation ?? 3,
      padding: c.dialog?.padding ?? theme.spacing.component.dialogPadding,
      actionGap: c.dialog?.actionGap ?? s.sm,
    },
    chip: {
      radius: c.chip?.radius ?? theme.shape.radius.sm,
      height: c.chip?.height ?? h.sm,
      paddingX: c.chip?.paddingX ?? s.md,
      iconGap: c.chip?.iconGap ?? s.xs,
      selected: { container: 'secondaryContainer', content: 'onSecondaryContainer', ...c.chip?.selected },
    },
    badge: { radius: c.badge?.radius ?? theme.shape.radius.full, paddingX: c.badge?.paddingX ?? s.xs },
  };
}

/** Resolves a role (or `transparent`) to a color for one mode. */
export function roleColor(scheme: ColorScheme, role: ColorRole | 'transparent'): string {
  return role === 'transparent' ? 'transparent' : scheme[role];
}
