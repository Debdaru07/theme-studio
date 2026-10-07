import type { ThemeInput } from './tokens.ts';

/**
 * Platform default layer. Every non-color token is given here, so a resolved theme is always
 * complete. Colors come from seeds, so tenants and clients usually only supply brand seeds.
 */
export const PLATFORM_DEFAULTS = {
  color: {
    seed: {
      primary: '#3B5BDB',
      secondary: '#5C677D',
      accent: '#E8590C',
      success: '#1B873F',
      warning: '#A15C00',
      error: '#BA1A1A',
      info: '#0B6BCB',
    },
  },
  typography: {
    fontFamily: {
      primary: 'Inter',
      secondary: '{typography.fontFamily.primary}',
      mono: 'JetBrains Mono',
    },
    styles: {
      display: { family: '{typography.fontFamily.secondary}', size: 45, weight: 400, lineHeight: 52, letterSpacing: 0, italic: false },
      headline: { family: '{typography.fontFamily.secondary}', size: 28, weight: 600, lineHeight: 36, letterSpacing: 0, italic: false },
      titleLarge: { family: '{typography.fontFamily.primary}', size: 22, weight: 600, lineHeight: 28, letterSpacing: 0, italic: false },
      titleMedium: { family: '{typography.fontFamily.primary}', size: 16, weight: 600, lineHeight: 24, letterSpacing: 0.15, italic: false },
      bodyLarge: { family: '{typography.fontFamily.primary}', size: 16, weight: 400, lineHeight: 24, letterSpacing: 0.15, italic: false },
      bodyMedium: { family: '{typography.fontFamily.primary}', size: 14, weight: 400, lineHeight: 20, letterSpacing: 0.25, italic: false },
      bodySmall: { family: '{typography.fontFamily.primary}', size: 12, weight: 400, lineHeight: 16, letterSpacing: 0.4, italic: false },
      labelLarge: { family: '{typography.fontFamily.primary}', size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.1, italic: false },
      labelMedium: { family: '{typography.fontFamily.primary}', size: 12, weight: 500, lineHeight: 16, letterSpacing: 0.5, italic: false },
      caption: { family: '{typography.fontFamily.primary}', size: 11, weight: 400, lineHeight: 16, letterSpacing: 0.5, italic: false },
    },
    responsiveScale: { mobile: 0.9, tablet: 1, desktop: 1, wide: 1.1 },
  },
  spacing: {
    scale: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 },
    layout: {
      mobile: { pagePadding: 16, sectionGap: 24, cardGap: 16, contentMaxWidth: null },
      tablet: { pagePadding: 24, sectionGap: 32, cardGap: 16, contentMaxWidth: null },
      desktop: { pagePadding: 32, sectionGap: 48, cardGap: 24, contentMaxWidth: 1200 },
      wide: { pagePadding: 40, sectionGap: 48, cardGap: 24, contentMaxWidth: 1280 },
    },
    component: {
      cardPadding: '{spacing.scale.lg}',
      dialogPadding: '{spacing.scale.xl}',
      listGap: '{spacing.scale.sm}',
      formGap: '{spacing.scale.lg}',
    },
  },
  sizing: {
    breakpoints: { tablet: 600, desktop: 1024, wide: 1440 },
    icon: { sm: 16, md: 20, lg: 24 },
    controlHeight: { sm: 32, md: 40, lg: 48 },
    minTouchTarget: 48,
  },
  shape: {
    radius: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 28, full: 9999 },
    borderWidth: { thin: 1, thick: 2 },
    cornerStyle: 'rounded',
  },
  elevation: {
    shadowColor: { light: '#000000', dark: '#000000' },
    levels: {
      level0: { offsetY: 0, blur: 0, spread: 0, opacity: 0 },
      level1: { offsetY: 1, blur: 3, spread: 0, opacity: 0.12 },
      level2: { offsetY: 2, blur: 6, spread: 0, opacity: 0.14 },
      level3: { offsetY: 4, blur: 12, spread: 0, opacity: 0.16 },
      level4: { offsetY: 8, blur: 20, spread: 0, opacity: 0.18 },
      level5: { offsetY: 12, blur: 28, spread: 0, opacity: 0.2 },
    },
    zIndex: { dropdown: 1000, sticky: 1100, overlay: 1200, modal: 1300, toast: 1400 },
  },
  motion: {
    duration: { short: 150, medium: 250, long: 400 },
    easing: {
      standard: [0.2, 0, 0, 1],
      emphasized: [0.3, 0, 0, 1],
      decelerate: [0, 0, 0, 1],
      accelerate: [0.3, 0, 1, 1],
    },
    pageTransition: 'sharedAxis',
    respectReducedMotion: true,
  },
  navigation: {
    pattern: { mobile: 'bottomBar', tablet: 'rail', desktop: 'sidebar', wide: 'sidebar' },
    showLabels: 'always',
    indicator: 'pill',
    appBar: { centeredTitle: false, elevated: false, height: 64 },
  },
  components: {
    // Defaults reproduce the SDK components' original look; every value follows the theme until overridden.
    button: {
      variant: 'filled',
      radius: '{shape.radius.full}',
      height: '{sizing.controlHeight.md}',
      paddingX: '{spacing.scale.xl}',
      textTransform: 'none',
      borderWidth: '{shape.borderWidth.thin}',
      iconGap: '{spacing.scale.sm}',
      sizes: {
        sm: { height: '{sizing.controlHeight.sm}', paddingX: '{spacing.scale.md}', textStyle: 'labelMedium' },
        md: { height: '{components.button.height}', paddingX: '{components.button.paddingX}', textStyle: 'labelLarge' },
        lg: { height: '{sizing.controlHeight.lg}', paddingX: '{spacing.scale.2xl}', textStyle: 'labelLarge' },
      },
      variants: {
        filled: { container: 'primary', content: 'onPrimary', border: 'transparent', elevation: 0 },
        tonal: { container: 'secondaryContainer', content: 'onSecondaryContainer', border: 'transparent', elevation: 0 },
        outlined: { container: 'transparent', content: 'primary', border: 'outline', elevation: 0 },
        text: { container: 'transparent', content: 'primary', border: 'transparent', elevation: 0 },
        danger: { container: 'error', content: 'onError', border: 'transparent', elevation: 0 },
      },
    },
    input: {
      variant: 'outlined',
      radius: '{shape.radius.sm}',
      height: '{sizing.controlHeight.lg}',
      borderWidth: '{shape.borderWidth.thin}',
      paddingX: '{spacing.scale.lg}',
      labelGap: '{spacing.scale.xs}',
    },
    card: {
      radius: '{shape.radius.md}',
      elevation: 1,
      bordered: false,
      padding: '{spacing.component.cardPadding}',
      gap: '{spacing.scale.sm}',
    },
    dialog: {
      radius: '{shape.radius.xl}',
      elevation: 3,
      padding: '{spacing.component.dialogPadding}',
      actionGap: '{spacing.scale.sm}',
    },
    chip: {
      radius: '{shape.radius.sm}',
      height: '{sizing.controlHeight.sm}',
      paddingX: '{spacing.scale.md}',
      iconGap: '{spacing.scale.xs}',
      selected: { container: 'secondaryContainer', content: 'onSecondaryContainer' },
    },
    badge: { radius: '{shape.radius.full}', paddingX: '{spacing.scale.xs}' },
  },
  effects: {
    opacity: { hover: 0.08, pressed: 0.12, disabled: 0.38 },
    focusRing: { width: 2, offset: 2 },
    blur: { sm: 4, md: 12 },
    gradient: { enabled: false, angle: 135, stops: ['primary', 'accent'] },
  },
  assets: {
    appName: 'My App',
    logo: { light: null, dark: null },
    favicon: null,
  },
} satisfies ThemeInput;
