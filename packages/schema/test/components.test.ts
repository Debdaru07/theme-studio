import { describe, expect, it } from 'vitest';
import { canEdit, checkComponents, resolveTheme, validateLayer, type ThemeInput } from '../src/index.ts';

const resolve = (layer: ThemeInput) => resolveTheme([layer]);
const paths = (layer: ThemeInput, level?: 'error' | 'warning') =>
  resolve(layer).components.issues.filter((i) => !level || i.level === level).map((i) => i.path);

describe('component tuning defaults', () => {
  it('follows the theme until overridden', () => {
    const { theme } = resolve({ shape: { radius: { sm: 6 } }, spacing: { component: { cardPadding: 20 } } });
    expect(theme.components.input.radius).toBe(6); // {shape.radius.sm}
    expect(theme.components.card.padding).toBe(20); // {spacing.component.cardPadding}
  });

  it('keeps legacy button height/paddingX driving the medium size', () => {
    const { theme } = resolve({ components: { button: { height: 44, paddingX: 20 } } });
    expect(theme.components.button.sizes.md).toMatchObject({ height: 44, paddingX: 20 });
    expect(theme.components.button.sizes.lg.height).toBe(48); // untouched sizes still follow sizing tokens
  });

  it('lets one size or variant be overridden without touching the rest', () => {
    const { theme } = resolve({
      components: { button: { sizes: { lg: { paddingX: 40 } }, variants: { tonal: { container: 'accentContainer', content: 'onAccentContainer' } } } },
    });
    expect(theme.components.button.sizes.lg).toEqual({ height: 48, paddingX: 40, textStyle: 'labelLarge' });
    expect(theme.components.button.variants.tonal.container).toBe('accentContainer');
    expect(theme.components.button.variants.filled.container).toBe('primary');
  });

  it('only accepts theme color roles, never hex values', () => {
    expect(() => resolve({ components: { button: { variants: { filled: { container: '#FF0000' as never } } } } })).toThrow(
      /components\.button\.variants\.filled\.container/,
    );
    expect(() => resolve({ components: { chip: { selected: { content: 'transparent' as never } } } })).toThrow();
  });
});

describe('checkComponents guardrails', () => {
  it('passes the platform defaults with no issues', () => {
    expect(checkComponents(resolveTheme([]).theme)).toEqual({ publishable: true, issues: [] });
  });

  it('blocks controls below the 24px minimum target and warns below 36px for md/lg', () => {
    expect(paths({ components: { button: { sizes: { lg: { height: 20 } } } } }, 'error')).toContain('components.button.sizes.lg.height');
    expect(paths({ components: { button: { sizes: { md: { height: 32 } } } } }, 'warning')).toContain('components.button.sizes.md.height');
    // Small buttons may be compact without a warning.
    expect(paths({ components: { button: { sizes: { sm: { height: 28 } } } } })).toEqual([]);
    expect(resolve({ components: { button: { sizes: { lg: { height: 20 } } } } }).components.publishable).toBe(false);
  });

  it('warns about spacing off the 4px grid', () => {
    expect(paths({ components: { card: { padding: 18 } } }, 'warning')).toEqual(['components.card.padding']);
  });

  it('blocks unreadable text on filled variants and warns on transparent ones', () => {
    const errors = paths({ components: { button: { variants: { filled: { content: 'primary' } } } } }, 'error');
    expect(errors).toContain('components.button.variants.filled.content'); // primary on primary
    const warnings = paths({ components: { button: { variants: { text: { content: 'outlineMuted' } } } } }, 'warning');
    expect(warnings).toContain('components.button.variants.text.content');
  });
});

describe('component tuning permissions', () => {
  it('lets agencies tune components and clients pick variants only', () => {
    expect(canEdit('tenant', 'components.button.sizes.lg.paddingX')).toBe(true);
    expect(canEdit('tenant', 'components.button.variants.filled.container')).toBe(true);
    expect(canEdit('client', 'components.button.sizes.lg.paddingX')).toBe(false);
    expect(canEdit('client', 'components.button.variants.filled.container')).toBe(false);
    expect(canEdit('client', 'components.button.variant')).toBe(true);
  });

  it('accepts the new paths in stored layers', () => {
    expect(validateLayer({ components: { chip: { selected: { container: 'primaryContainer' } }, badge: { paddingX: 8 } } }, 'tenant')).toEqual([]);
  });
});
