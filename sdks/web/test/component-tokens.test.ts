import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Theme } from '@debdaru07/schema';
import { describe, expect, it } from 'vitest';
import { componentTokens, layoutVariables, modeVariables, staticVariables, toCssVariables } from '../src/index.ts';
import { base } from './fixtures.ts';

/** The default theme with some component tuning applied, as Theme Studio would publish it. */
function tuned(): Theme {
  const t = structuredClone(base);
  const b = t.components.button;
  b.sizes.lg = { height: 56, paddingX: 40, textStyle: 'titleMedium' };
  b.variants.tonal = { container: 'accentContainer', content: 'onAccentContainer', border: 'transparent', elevation: 2 };
  b.borderWidth = 2;
  t.components.card.padding = 24;
  t.components.chip.height = 36;
  t.components.badge.paddingX = 8;
  return t;
}

/** A theme as published before component tuning existed. */
function legacy(): Theme {
  const t = structuredClone(base) as unknown as { components: Record<string, Record<string, unknown>> };
  const c = t.components;
  for (const k of ['borderWidth', 'iconGap', 'sizes', 'variants']) delete c.button![k];
  for (const k of ['borderWidth', 'paddingX', 'labelGap']) delete c.input![k];
  for (const k of ['padding', 'gap']) delete c.card![k];
  for (const k of ['padding', 'actionGap']) delete c.dialog![k];
  c.chip = { radius: c.chip!.radius };
  c.badge = { radius: c.badge!.radius };
  return t as unknown as Theme;
}

describe('componentTokens', () => {
  it('returns resolved themes unchanged', () => {
    expect(componentTokens(base)).toEqual(base.components);
  });

  it('fills themes published before component tuning with the defaults a current server would derive', () => {
    expect(componentTokens(legacy())).toEqual(base.components);
  });
});

describe('component tuning CSS variables', () => {
  it('emits per-size, spacing and border variables', () => {
    const v = toCssVariables(tuned(), 'light');
    expect(v['--dts-button-lg-height']).toBe('56px');
    expect(v['--dts-button-lg-padding-x']).toBe('40px');
    expect(v['--dts-button-lg-text-size']).toBe(`${base.typography.styles.titleMedium.size}px`);
    expect(v['--dts-button-md-height']).toBe(`${base.components.button.height}px`);
    expect(v['--dts-button-border-width']).toBe('2px');
    expect(v['--dts-card-padding']).toBe('24px');
    expect(v['--dts-card-item-gap']).toBe(`${base.components.card.gap}px`); // not the layout --dts-card-gap
    expect(v['--dts-chip-height']).toBe('36px');
    expect(v['--dts-badge-padding-x']).toBe('8px');
  });

  it('resolves variant color roles per mode, and passes transparent through', () => {
    const light = toCssVariables(tuned(), 'light');
    const dark = toCssVariables(tuned(), 'dark');
    expect(light['--dts-button-tonal-container']).toBe(base.color.light.accentContainer);
    expect(dark['--dts-button-tonal-container']).toBe(base.color.dark.accentContainer);
    expect(light['--dts-button-outlined-container']).toBe('transparent');
    expect(light['--dts-button-outlined-border']).toBe(base.color.light.outline);
    expect(light['--dts-button-tonal-shadow']).not.toBe('none'); // elevation 2
    expect(light['--dts-chip-selected-container']).toBe(base.color.light.secondaryContainer);
  });

  it('never emits the same variable name from two groups (a later group would silently override it)', () => {
    const names = [...Object.keys(staticVariables(base)), ...Object.keys(modeVariables(base, 'light')), ...Object.keys(layoutVariables(base, 'mobile'))];
    expect(names.length).toBe(new Set(names).size);
  });

  it('gives legacy themes the same variables as current ones', () => {
    expect(toCssVariables(legacy(), 'light')).toEqual(toCssVariables(base, 'light'));
  });

  it('components.css reads every emitted button variable family', () => {
    // happy-dom replaces import.meta.url; workspace tests run from the package directory.
    const css = readFileSync(join(process.cwd(), 'src/components.css'), 'utf8');
    for (const name of ['button-sm-height', 'button-lg-padding-x', 'button-md-text-size', 'button-tonal-container', 'button-danger-content',
      'button-border-width', 'button-icon-gap', 'input-padding-x', 'input-label-gap', 'chip-height', 'chip-selected-container', 'badge-padding-x',
      'card-item-gap', 'dialog-action-gap']) {
      expect(css, name).toContain(`var(--dts-${name}`);
    }
  });
});
