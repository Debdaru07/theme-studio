import { z } from 'zod';

/**
 * Schema for a fully *resolved* theme — what the API serves and every SDK consumes.
 * All references are replaced with literals and every color is filled in.
 */

export const SCHEMA_VERSION = 1 as const;

export const BREAKPOINTS = ['mobile', 'tablet', 'desktop', 'wide'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

const hex = z
  .string()
  .regex(/^#([0-9A-F]{6}|[0-9A-F]{8})$/, 'Expected uppercase #RRGGBB or #RRGGBBAA');
const px = z.number().min(0).max(10_000);
const ratio = z.number().min(0).max(1);

const perBreakpoint = <T extends z.ZodType>(t: T) =>
  z.strictObject({ mobile: t, tablet: t, desktop: t, wide: t });

// ── Color ────────────────────────────────────────────────────────────────────

export const BRAND_ROLES = ['primary', 'secondary', 'accent'] as const;
export const SEMANTIC_ROLES = ['success', 'warning', 'error', 'info'] as const;
export const SEED_KEYS = [...BRAND_ROLES, 'neutral', ...SEMANTIC_ROLES] as const;
export type SeedKey = (typeof SEED_KEYS)[number];

const keyColorTokens = <R extends string>(role: R) => {
  const cap = (role.charAt(0).toUpperCase() + role.slice(1)) as Capitalize<R>;
  return {
    [role]: hex,
    [`on${cap}`]: hex,
    [`${role}Container`]: hex,
    [`on${cap}Container`]: hex,
  } as Record<R | `on${Capitalize<R>}` | `${R}Container` | `on${Capitalize<R>}Container`, typeof hex>;
};

export const ColorSchemeSchema = z.strictObject({
  ...keyColorTokens('primary'),
  ...keyColorTokens('secondary'),
  ...keyColorTokens('accent'),
  ...keyColorTokens('success'),
  ...keyColorTokens('warning'),
  ...keyColorTokens('error'),
  ...keyColorTokens('info'),
  background: hex,
  surface: hex,
  surfaceContainerLow: hex,
  surfaceContainer: hex,
  surfaceContainerHigh: hex,
  onSurface: hex,
  onSurfaceMuted: hex,
  onSurfaceDisabled: hex,
  outline: hex,
  outlineMuted: hex,
  focusRing: hex,
  scrim: hex,
});
export type ColorScheme = z.infer<typeof ColorSchemeSchema>;
export type ColorRole = keyof ColorScheme;

/** Which seed each color token is derived from. Used to invalidate stale overrides. */
export function seedOf(token: ColorRole): SeedKey {
  for (const role of [...BRAND_ROLES, ...SEMANTIC_ROLES]) {
    if (token.toLowerCase().includes(role)) return role;
  }
  return token === 'focusRing' ? 'primary' : 'neutral';
}

// ── Typography ───────────────────────────────────────────────────────────────

export const TEXT_STYLES = [
  'display',
  'headline',
  'titleLarge',
  'titleMedium',
  'bodyLarge',
  'bodyMedium',
  'bodySmall',
  'labelLarge',
  'labelMedium',
  'caption',
] as const;
export type TextStyleName = (typeof TEXT_STYLES)[number];

export const TextStyleSchema = z.strictObject({
  family: z.string().min(1),
  size: px,
  weight: z.number().int().min(100).max(900).multipleOf(100),
  /** Absolute line height in px. */
  lineHeight: px,
  /** Letter spacing in px. */
  letterSpacing: z.number().min(-5).max(5),
  /** Added after v1 shipped; SDKs treat a missing value as `false`. */
  italic: z.boolean(),
});
export type TextStyle = z.infer<typeof TextStyleSchema>;

const TypographySchema = z.strictObject({
  fontFamily: z.strictObject({
    primary: z.string().min(1),
    secondary: z.string().min(1),
    mono: z.string().min(1),
  }),
  styles: z.strictObject(
    Object.fromEntries(TEXT_STYLES.map((s) => [s, TextStyleSchema])) as Record<
      TextStyleName,
      typeof TextStyleSchema
    >,
  ),
  /** Multiplier applied to `display` and `headline` only. */
  responsiveScale: perBreakpoint(z.number().min(0.5).max(2)),
});

// ── Spacing / sizing / shape ─────────────────────────────────────────────────

const SpacingSchema = z.strictObject({
  scale: z.strictObject({ xs: px, sm: px, md: px, lg: px, xl: px, '2xl': px, '3xl': px }),
  layout: perBreakpoint(
    z.strictObject({
      pagePadding: px,
      sectionGap: px,
      cardGap: px,
      /** `null` = unconstrained. */
      contentMaxWidth: px.nullable(),
    }),
  ),
  component: z.strictObject({ cardPadding: px, dialogPadding: px, listGap: px, formGap: px }),
});

const SizingSchema = z.strictObject({
  /** Minimum widths; `mobile` always starts at 0. */
  breakpoints: z.strictObject({ tablet: px, desktop: px, wide: px }),
  icon: z.strictObject({ sm: px, md: px, lg: px }),
  controlHeight: z.strictObject({ sm: px, md: px, lg: px }),
  minTouchTarget: px,
});

const ShapeSchema = z.strictObject({
  radius: z.strictObject({ none: px, xs: px, sm: px, md: px, lg: px, xl: px, full: px }),
  borderWidth: z.strictObject({ thin: px, thick: px }),
  cornerStyle: z.enum(['rounded', 'cut']),
});

// ── Elevation ────────────────────────────────────────────────────────────────

const ShadowSchema = z.strictObject({
  offsetY: px,
  blur: px,
  spread: z.number().min(-100).max(100),
  /** Shadow color opacity, applied to `shadowColor`. */
  opacity: ratio,
});

const ELEVATION_LEVELS = ['level0', 'level1', 'level2', 'level3', 'level4', 'level5'] as const;

const ElevationSchema = z.strictObject({
  shadowColor: z.strictObject({ light: hex, dark: hex }),
  levels: z.strictObject(
    Object.fromEntries(ELEVATION_LEVELS.map((l) => [l, ShadowSchema])) as Record<
      (typeof ELEVATION_LEVELS)[number],
      typeof ShadowSchema
    >,
  ),
  zIndex: z.strictObject({
    dropdown: z.number().int(),
    sticky: z.number().int(),
    overlay: z.number().int(),
    modal: z.number().int(),
    toast: z.number().int(),
  }),
});

// ── Motion & navigation ──────────────────────────────────────────────────────

const cubicBezier = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const PAGE_TRANSITIONS = ['fade', 'slide', 'scale', 'sharedAxis', 'none'] as const;
export const NAV_PATTERNS = ['bottomBar', 'rail', 'drawer', 'sidebar', 'topTabs'] as const;

const MotionSchema = z.strictObject({
  duration: z.strictObject({ short: px, medium: px, long: px }),
  easing: z.strictObject({
    standard: cubicBezier,
    emphasized: cubicBezier,
    decelerate: cubicBezier,
    accelerate: cubicBezier,
  }),
  pageTransition: z.enum(PAGE_TRANSITIONS),
  respectReducedMotion: z.boolean(),
});

const NavigationSchema = z.strictObject({
  pattern: perBreakpoint(z.enum(NAV_PATTERNS)),
  showLabels: z.enum(['always', 'selected', 'never']),
  indicator: z.enum(['pill', 'underline', 'none']),
  appBar: z.strictObject({ centeredTitle: z.boolean(), elevated: z.boolean(), height: px }),
});

// ── Components ───────────────────────────────────────────────────────────────

const elevationLevel = z.number().int().min(0).max(5);

/*
 * Component tuning. Every value defaults to a {reference} into the theme (see defaults.ts), so components follow
 * the theme until an agency overrides a specific value. Colors are always theme roles, never hex values, which
 * keeps the palette and contrast checks intact.
 */
export const COLOR_ROLES = Object.keys(ColorSchemeSchema.shape) as [ColorRole, ...ColorRole[]];
const colorRole = z.enum(COLOR_ROLES);
/** A role, or `transparent` for containers and borders. */
const surfaceRole = z.enum([...COLOR_ROLES, 'transparent']);
export type SurfaceRole = ColorRole | 'transparent';

export const CONTROL_SIZES = ['sm', 'md', 'lg'] as const;
export type ControlSize = (typeof CONTROL_SIZES)[number];
export const BUTTON_VARIANTS = ['filled', 'tonal', 'outlined', 'text', 'danger'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const ControlSizeSchema = z.strictObject({ height: px, paddingX: px, textStyle: z.enum(TEXT_STYLES) });
const ButtonVariantStyleSchema = z.strictObject({
  container: surfaceRole,
  content: colorRole,
  border: surfaceRole,
  elevation: elevationLevel,
});
export type ButtonVariantStyle = z.infer<typeof ButtonVariantStyleSchema>;

const ComponentsSchema = z.strictObject({
  button: z.strictObject({
    /** The variant `<Button>` uses when none is given. */
    variant: z.enum(['filled', 'tonal', 'outlined']),
    radius: px,
    /** Medium height and padding; `sizes.md` references these, so older themes keep working. */
    height: px,
    paddingX: px,
    textTransform: z.enum(['none', 'uppercase', 'capitalize']),
    borderWidth: px,
    iconGap: px,
    sizes: z.strictObject({ sm: ControlSizeSchema, md: ControlSizeSchema, lg: ControlSizeSchema }),
    variants: z.strictObject(
      Object.fromEntries(BUTTON_VARIANTS.map((v) => [v, ButtonVariantStyleSchema])) as Record<
        ButtonVariant,
        typeof ButtonVariantStyleSchema
      >,
    ),
  }),
  input: z.strictObject({
    variant: z.enum(['filled', 'outlined']),
    radius: px,
    height: px,
    borderWidth: px,
    paddingX: px,
    /** Space between the label and the field. */
    labelGap: px,
  }),
  card: z.strictObject({ radius: px, elevation: elevationLevel, bordered: z.boolean(), padding: px, gap: px }),
  dialog: z.strictObject({ radius: px, elevation: elevationLevel, padding: px, actionGap: px }),
  chip: z.strictObject({
    radius: px,
    height: px,
    paddingX: px,
    iconGap: px,
    selected: z.strictObject({ container: colorRole, content: colorRole }),
  }),
  badge: z.strictObject({ radius: px, paddingX: px }),
});

// ── Effects & assets ─────────────────────────────────────────────────────────

const EffectsSchema = z.strictObject({
  opacity: z.strictObject({ hover: ratio, pressed: ratio, disabled: ratio }),
  focusRing: z.strictObject({ width: px, offset: px }),
  blur: z.strictObject({ sm: px, md: px }),
  gradient: z.strictObject({
    enabled: z.boolean(),
    angle: z.number().min(0).max(360),
    /** Color roles resolved per mode by the SDK. */
    stops: z.array(z.enum(Object.keys(ColorSchemeSchema.shape) as [ColorRole, ...ColorRole[]])).min(2),
  }),
});

const url = z.string().url().nullable();

const AssetsSchema = z.strictObject({
  appName: z.string().min(1).max(80),
  logo: z.strictObject({ light: url, dark: url }),
  favicon: url,
});

// ── Theme ────────────────────────────────────────────────────────────────────

export const ThemeMetaSchema = z.strictObject({
  tenant: z.string(),
  client: z.string().nullable(),
  version: z.number().int().min(0),
  publishedAt: z.string().nullable(),
  hash: z.string(),
});
export type ThemeMeta = z.infer<typeof ThemeMetaSchema>;

export const ThemeSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  meta: ThemeMetaSchema.optional(),
  color: z.strictObject({ light: ColorSchemeSchema, dark: ColorSchemeSchema }),
  typography: TypographySchema,
  spacing: SpacingSchema,
  sizing: SizingSchema,
  shape: ShapeSchema,
  elevation: ElevationSchema,
  motion: MotionSchema,
  navigation: NavigationSchema,
  components: ComponentsSchema,
  effects: EffectsSchema,
  assets: AssetsSchema,
});
export type Theme = z.infer<typeof ThemeSchema>;

// ── Input (what tenants/clients store) ───────────────────────────────────────

/** A token reference such as `"{shape.radius.md}"`. */
export type TokenRef = `{${string}}`;

type DeepPartialRef<T> = T extends readonly unknown[]
  ? T | TokenRef
  : T extends object
    ? { [K in keyof T]?: DeepPartialRef<T[K]> }
    : T | TokenRef;

export type ColorSeeds = Partial<Record<SeedKey, string>>;

/**
 * A theme layer as stored for the platform, a tenant or a client. Every field is optional,
 * any leaf may be a `{reference}`, and colors may be given as seeds.
 */
export type ThemeInput = DeepPartialRef<Omit<Theme, 'schemaVersion' | 'meta' | 'color'>> & {
  color?: {
    seed?: ColorSeeds;
    light?: Partial<ColorScheme>;
    dark?: Partial<ColorScheme>;
  };
};
