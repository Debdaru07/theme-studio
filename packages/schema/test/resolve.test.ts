import { describe, expect, it } from 'vitest';
import {
  DEMO_CLIENTS,
  DEMO_TENANT_BASE,
  ThemeValidationError,
  canEdit,
  contrastRatio,
  editableBy,
  normalizeHex,
  resolveTheme,
  validateLayer,
  type ThemeInput,
} from '../src/index.ts';

describe('resolveTheme', () => {
  it('produces a complete, valid theme from defaults alone', () => {
    const { theme, contrast } = resolveTheme([]);
    expect(theme.schemaVersion).toBe(1);
    expect(theme.color.light.primary).toBe('#3B5BDB');
    expect(theme.color.dark.primary).not.toBe('#3B5BDB');
    expect(contrast.publishable).toBe(true);
  });

  it('platform defaults raise no contrast warnings at all', () => {
    expect(resolveTheme([]).contrast.issues).toEqual([]);
  });

  it('resolves token references to literals', () => {
    const { theme } = resolveTheme([]);
    expect(theme.components.button.radius).toBe(9999);
    expect(theme.components.button.height).toBe(40);
    expect(theme.spacing.component.cardPadding).toBe(16);
    expect(theme.typography.styles.display.family).toBe('Inter'); // secondary → primary → Inter
  });

  it('follows references through later layers', () => {
    const { theme } = resolveTheme([{ shape: { radius: { full: 20 } } }]);
    expect(theme.components.button.radius).toBe(20);
  });

  it('keeps the exact brand hex in light mode and derives on-colors', () => {
    const { theme } = resolveTheme([{ color: { seed: { primary: '#ffd43b' } } }]);
    expect(theme.color.light.primary).toBe('#FFD43B');
    // A light yellow needs dark text.
    expect(contrastRatio(theme.color.light.onPrimary, '#FFD43B')).toBeGreaterThan(4.5);
  });

  it('applies explicit overrides on top of derived colors', () => {
    const { theme } = resolveTheme([{ color: { light: { surface: '#fafafa' } } }]);
    expect(theme.color.light.surface).toBe('#FAFAFA');
  });

  it('drops lower-layer overrides when a higher layer changes their seed', () => {
    const tenant: ThemeInput = { color: { light: { primaryContainer: '#123456', surface: '#FAFAFA' } } };
    const client: ThemeInput = { color: { seed: { primary: '#0F766E' } } };
    const { theme } = resolveTheme([tenant, client]);
    expect(theme.color.light.primaryContainer).not.toBe('#123456'); // re-derived from new seed
    expect(theme.color.light.surface).toBe('#FAFAFA'); // neutral override survives
  });

  it('rejects bad values with paths', () => {
    try {
      resolveTheme([{ motion: { pageTransition: 'spin' as never } }]);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ThemeValidationError);
      expect((e as ThemeValidationError).issues[0]!.path).toBe('motion.pageTransition');
    }
  });

  it('reports unknown and circular references', () => {
    expect(() => resolveTheme([{ shape: { radius: { md: '{shape.radius.nope}' } } }])).toThrow(/Unknown reference/);
    expect(() =>
      resolveTheme([{ shape: { radius: { md: '{shape.radius.lg}', lg: '{shape.radius.md}' } } }]),
    ).toThrow(/Circular reference/);
  });

  it('rejects malformed colors', () => {
    expect(() => resolveTheme([{ color: { seed: { primary: 'blue' } } }])).toThrow(/color.seed.primary/);
  });

  it('blocks publishing when a core pair fails contrast', () => {
    const { contrast } = resolveTheme([{ color: { light: { onSurface: '#EEEEEE' } } }]);
    expect(contrast.publishable).toBe(false);
    expect(contrast.issues).toContainEqual(
      expect.objectContaining({ mode: 'light', fg: 'onSurface', bg: 'surface', level: 'error' }),
    );
  });

  it('resolves both demo clients and they are publishable', () => {
    for (const { layer } of Object.values(DEMO_CLIENTS)) {
      const { contrast } = resolveTheme([DEMO_TENANT_BASE, layer]);
      expect(contrast.publishable).toBe(true);
    }
  });
});

describe('policy', () => {
  it('lets clients change brand, layout and variants but not ergonomics', () => {
    expect(canEdit('client', 'color.seed.primary')).toBe(true);
    expect(canEdit('client', 'spacing.layout.mobile.pagePadding')).toBe(true);
    expect(canEdit('client', 'spacing.component.cardPadding')).toBe(true);
    expect(canEdit('client', 'components.button.variant')).toBe(true);
    expect(canEdit('client', 'components.button.height')).toBe(false);
    expect(canEdit('client', 'spacing.component.formGap')).toBe(false);
    expect(canEdit('tenant', 'spacing.component.formGap')).toBe(true);
    expect(canEdit('tenant', 'spacing.scale.md')).toBe(false);
    expect(editableBy('sizing.minTouchTarget')).toBe('platform');
  });

  it('validateLayer reports unknown and locked tokens', () => {
    const issues = validateLayer(
      { color: { seed: { primary: '#000000' } }, sizing: { minTouchTarget: 30 }, foo: { bar: 1 } },
      'client',
    );
    expect(issues.map((i) => i.path).sort()).toEqual(['foo.bar', 'sizing.minTouchTarget']);
  });

  it('accepts the demo client layers', () => {
    for (const { layer } of Object.values(DEMO_CLIENTS)) expect(validateLayer(layer, 'client')).toEqual([]);
  });
});

describe('normalizeHex', () => {
  it('normalises short and lowercase forms', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('11223344')).toBe('#11223344');
  });
});
