import { describe, expect, it } from 'vitest';
import {
  TEXT_STYLES,
  type ColorRole,
  type Theme,
} from '@dts/schema';
import {
  breakpointFor,
  cssVar,
  cssVarName,
  getToken,
  kebab,
  googleFontsUrls,
  motionTokens,
  themeStylesheet,
  toCssVariables,
} from '../src/index.ts';
import { FIXTURES, acme, globex } from './fixtures.ts';

describe('naming', () => {
  it('kebab-cases token names', () => {
    expect(kebab('onPrimaryContainer')).toBe('on-primary-container');
    expect(kebab('paddingX')).toBe('padding-x');
    expect(kebab('2xl')).toBe('2xl');
    expect(kebab('level3')).toBe('level3');
  });

  it('builds var names and references', () => {
    expect(cssVarName('color.onPrimaryContainer')).toBe('--dts-color-on-primary-container');
    expect(cssVarName('text.bodyMedium.lineHeight')).toBe('--dts-text-body-medium-line-height');
    expect(cssVarName('focusRing.width')).toBe('--dts-focus-ring-width');
    expect(cssVarName('controlHeight.md')).toBe('--dts-control-height-md');
    expect(cssVarName('button.paddingX')).toBe('--dts-button-padding-x');
    expect(cssVar('color.primary')).toBe('var(--dts-color-primary)');
    expect(cssVar('space.md', '12px')).toBe('var(--dts-space-md, 12px)');
  });
});

describe.each(Object.entries(FIXTURES))('toCssVariables(%s)', (_name, theme: Theme) => {
  const light = toCssVariables(theme, 'light');
  const dark = toCssVariables(theme, 'dark');

  it('emits every color role per mode', () => {
    for (const role of Object.keys(theme.color.light) as ColorRole[]) {
      expect(light[cssVarName(`color.${role}`)]).toBe(theme.color.light[role]);
      expect(dark[cssVarName(`color.${role}`)]).toBe(theme.color.dark[role]);
    }
  });

  it('emits lengths in px', () => {
    expect(light['--dts-space-xs']).toBe(`${theme.spacing.scale.xs}px`);
    expect(light['--dts-space-2xl']).toBe(`${theme.spacing.scale['2xl']}px`);
    expect(light['--dts-space-3xl']).toBe(`${theme.spacing.scale['3xl']}px`);
    expect(light['--dts-radius-none']).toBe('0px');
    expect(light['--dts-radius-full']).toBe('9999px');
    expect(light['--dts-border-thin']).toBe(`${theme.shape.borderWidth.thin}px`);
    expect(light['--dts-control-height-lg']).toBe(`${theme.sizing.controlHeight.lg}px`);
    expect(light['--dts-icon-md']).toBe(`${theme.sizing.icon.md}px`);
    expect(light['--dts-focus-ring-width']).toBe(`${theme.effects.focusRing.width}px`);
    expect(light['--dts-blur-md']).toBe(`${theme.effects.blur.md}px`);
    expect(light['--dts-button-height']).toBe(`${theme.components.button.height}px`);
    expect(light['--dts-button-padding-x']).toBe(`${theme.components.button.paddingX}px`);
    expect(light['--dts-input-radius']).toBe(`${theme.components.input.radius}px`);
    expect(light['--dts-card-padding']).toBe(`${theme.spacing.component.cardPadding}px`);
    expect(light['--dts-list-gap']).toBe(`${theme.spacing.component.listGap}px`);
  });

  it('emits all text styles', () => {
    for (const style of TEXT_STYLES) {
      const s = theme.typography.styles[style];
      const k = `--dts-text-${kebab(style)}`;
      expect(light[`${k}-size`]).toBe(`${s.size}px`);
      expect(light[`${k}-weight`]).toBe(String(s.weight));
      expect(light[`${k}-line-height`]).toBe(`${s.lineHeight}px`);
      expect(light[`${k}-letter-spacing`]).toBe(`${s.letterSpacing}px`);
      expect(light[`${k}-family`]).toContain(`"${s.family}"`);
    }
  });

  it('emits motion, z-index, opacity and unitless numbers as-is', () => {
    expect(light['--dts-duration-medium']).toBe(`${theme.motion.duration.medium}ms`);
    expect(light['--dts-easing-standard']).toBe(`cubic-bezier(${theme.motion.easing.standard.join(', ')})`);
    expect(light['--dts-z-modal']).toBe(String(theme.elevation.zIndex.modal));
    expect(light['--dts-opacity-disabled']).toBe(String(theme.effects.opacity.disabled));
    expect(light['--dts-text-body-medium-weight']).not.toMatch(/px$/);
  });

  it('has no gradient var when the gradient is disabled', () => {
    expect(theme.effects.gradient.enabled).toBe(false);
    expect(light['--dts-gradient-brand']).toBeUndefined();
  });
});

describe('specific fixture values', () => {
  it('acme: fonts, shadows, layout', () => {
    const v = toCssVariables(acme, 'light', 'mobile');
    expect(v['--dts-font-primary']).toBe('"Roboto", system-ui, sans-serif');
    expect(v['--dts-font-mono']).toBe('"JetBrains Mono", ui-monospace, monospace');
    expect(v['--dts-text-display-family']).toBe('"Poppins", system-ui, sans-serif');
    expect(v['--dts-shadow-level0']).toBe('none');
    expect(v['--dts-shadow-level1']).toBe('0 1px 3px 0px rgba(0, 0, 0, 0.12)');
    expect(v['--dts-card-shadow']).toBe(v['--dts-shadow-level1']);
    expect(v['--dts-dialog-shadow']).toBe(v['--dts-shadow-level3']);
    expect(v['--dts-card-border']).toBe('none');
    expect(v['--dts-button-radius']).toBe('9999px');
    expect(v['--dts-page-padding']).toBe('16px');
    expect(v['--dts-content-max-width']).toBe('none');
    expect(v['--dts-corner-style']).toBe('rounded');

    const desktop = toCssVariables(acme, 'light', 'desktop');
    expect(desktop['--dts-page-padding']).toBe('32px');
    expect(desktop['--dts-section-gap']).toBe('48px');
    expect(desktop['--dts-content-max-width']).toBe('1200px');
  });

  it('globex: cut corners, multi-word fonts, dark colors', () => {
    const v = toCssVariables(globex, 'dark', 'wide');
    expect(v['--dts-color-primary']).toBe('#80D5CB');
    expect(v['--dts-color-on-surface-disabled']).toBe('#E3E2E661');
    expect(v['--dts-font-primary']).toBe('"Nunito Sans", system-ui, sans-serif');
    expect(v['--dts-corner-style']).toBe('cut');
    expect(v['--dts-radius-md']).toBe('4px');
    expect(v['--dts-content-max-width']).toBe('1280px');
  });

  it('emits the brand gradient when enabled, per mode', () => {
    const t: Theme = { ...acme, effects: { ...acme.effects, gradient: { enabled: true, angle: 90, stops: ['primary', 'accent'] } } };
    expect(toCssVariables(t, 'light')['--dts-gradient-brand']).toBe('linear-gradient(90deg, #1D4ED8, #F97316)');
    expect(toCssVariables(t, 'dark')['--dts-gradient-brand']).toBe('linear-gradient(90deg, #B7C4FF, #FFB690)');
  });

  it('applies alpha of 8-digit shadow colors', () => {
    const t: Theme = { ...acme, elevation: { ...acme.elevation, shadowColor: { light: '#11223380', dark: '#000000' } } };
    expect(toCssVariables(t, 'light')['--dts-shadow-level5']).toBe('0 12px 28px 0px rgba(17, 34, 51, 0.1)');
  });

  it('bordered cards reference the outline-muted color var', () => {
    const t: Theme = { ...acme, components: { ...acme.components, card: { ...acme.components.card, bordered: true } } };
    expect(toCssVariables(t, 'light')['--dts-card-border']).toBe('1px solid var(--dts-color-outline-muted)');
  });
});

describe('italic text styles', () => {
  const withItalicCaption = () => {
    const t = structuredClone(acme);
    t.typography.styles.caption.italic = true;
    return t;
  };

  it('emits font-style per text style', () => {
    expect(toCssVariables(acme, 'light')['--dts-text-caption-font-style']).toBe('normal');
    expect(toCssVariables(withItalicCaption(), 'light')['--dts-text-caption-font-style']).toBe('italic');
  });

  it('requests the ital axis only for families used in italics', () => {
    const urls = googleFontsUrls(withItalicCaption());
    const roboto = urls.find((u) => u.includes('family=Roboto:'))!;
    expect(roboto).toContain(':ital,wght@0,');
    expect(roboto).toContain(';1,400');
    expect(urls.find((u) => u.includes('family=Poppins:'))).toContain(':wght@');
    expect(googleFontsUrls(acme).every((u) => !u.includes('ital'))).toBe(true);
  });
});

describe('helpers', () => {
  it('breakpointFor uses min-width thresholds', () => {
    expect(breakpointFor(0, acme)).toBe('mobile');
    expect(breakpointFor(599, acme)).toBe('mobile');
    expect(breakpointFor(600, acme)).toBe('tablet');
    expect(breakpointFor(1023, acme)).toBe('tablet');
    expect(breakpointFor(1024, acme)).toBe('desktop');
    expect(breakpointFor(1440, acme)).toBe('wide');
  });

  it('getToken resolves color paths against the mode', () => {
    expect(getToken(acme, 'light', 'color.primary')).toBe('#1D4ED8');
    expect(getToken(acme, 'dark', 'color.primary')).toBe('#B7C4FF');
    expect(getToken(acme, 'light', 'spacing.scale.md')).toBe(12);
    expect(getToken(acme, 'light', 'typography.styles.bodyMedium.size')).toBe(14);
    expect(getToken(acme, 'light', 'spacing.layout.mobile.contentMaxWidth')).toBeNull();
    expect(getToken(acme, 'light', 'nope.nothing' as never)).toBeUndefined();
  });

  it('motionTokens respects reduced motion only when the theme opts in', () => {
    expect(motionTokens(acme).duration.medium).toBe(250);
    const reduced = motionTokens(acme, { prefersReducedMotion: true });
    expect(reduced.reduced).toBe(true);
    expect(reduced.duration.medium).toBe(0);
    expect(reduced.pageTransition).toBe('none');
    const optOut: Theme = { ...acme, motion: { ...acme.motion, respectReducedMotion: false } };
    expect(motionTokens(optOut, { prefersReducedMotion: true }).pageTransition).toBe('slide');
  });

  it('themeStylesheet emits light, dark and breakpoint blocks', () => {
    const css = themeStylesheet(acme, '.preview');
    expect(css).toContain('.preview {\n  color-scheme: light;');
    expect(css).toContain('--dts-color-primary: #1D4ED8;');
    expect(css).toContain('.preview[data-dts-mode="dark"] {');
    expect(css).toContain('--dts-color-primary: #B7C4FF;');
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('--dts-content-max-width: 1200px;');
    const darkBlock = css.slice(css.indexOf('[data-dts-mode="dark"]'), css.indexOf('@media'));
    expect(darkBlock).not.toContain('--dts-space-md');
  });
});
