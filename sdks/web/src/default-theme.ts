import type { Theme } from '@debdaru07/schema';
import defaultThemeJson from '@debdaru07/schema/fixtures/default.json' with { type: 'json' };

/**
 * The platform default theme, bundled so apps always have something to render
 * (fallback order: network → cache → this).
 */
export const DEFAULT_THEME: Theme = defaultThemeJson as unknown as Theme;
