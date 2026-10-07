import { describe, expect, it } from 'vitest';
import type { Theme } from '@debdaru07/schema';
import defaultJson from '@debdaru07/schema/fixtures/default.json' with { type: 'json' };
import globexJson from '@debdaru07/schema/fixtures/globex.json' with { type: 'json' };
import { badgeStyle, buttonStyles, cardStyle, chipStyles, cornerRadius, dialogStyles, inputStyles, shadow, textStyle } from '../src/index.ts';

const base = defaultJson as unknown as Theme;
const globex = globexJson as unknown as Theme;

/** Default fixture with non-default component tuning. */
function tunedTheme(): Theme {
  const t = structuredClone(base);
  const c = t.components;
  c.button.sizes.lg = { height: 56, paddingX: 40, textStyle: 'titleMedium' };
  c.button.variants.tonal = { container: 'accentContainer', content: 'onAccentContainer', border: 'transparent', elevation: 2 };
  c.button.variants.outlined.border = 'outline';
  c.button.borderWidth = 2;
  c.button.iconGap = 12;
  c.button.textTransform = 'uppercase';
  c.input.borderWidth = 2;
  c.input.paddingX = 20;
  c.input.labelGap = 6;
  c.card.padding = 24;
  c.card.gap = 12;
  c.card.bordered = true;
  c.dialog.padding = 32;
  c.dialog.actionGap = 16;
  c.chip.height = 36;
  c.chip.paddingX = 16;
  c.chip.iconGap = 6;
  c.chip.selected = { container: 'primaryContainer', content: 'onPrimaryContainer' };
  c.badge.paddingX = 8;
  return t;
}

/** A theme as published before component tuning existed: the phase-1 fields are missing. */
function legacyTheme(): Theme {
  const t = structuredClone(base) as unknown as { components: Record<string, Record<string, unknown>> };
  const c = t.components;
  for (const k of ['borderWidth', 'iconGap', 'sizes', 'variants']) delete c.button![k];
  for (const k of ['borderWidth', 'paddingX', 'labelGap']) delete c.input![k];
  for (const k of ['padding', 'gap']) delete c.card![k];
  for (const k of ['padding', 'actionGap']) delete c.dialog![k];
  for (const k of ['height', 'paddingX', 'iconGap', 'selected']) delete c.chip![k];
  delete c.badge!.paddingX;
  return t as unknown as Theme;
}

describe('buttonStyles', () => {
  const tuned = tunedTheme();

  it('applies the size tokens (height, paddingX, text style) and icon gap', () => {
    const { container, label } = buttonStyles(tuned, { size: 'lg', variant: 'filled', mode: 'light' });
    expect(container).toMatchObject({ minHeight: 56, paddingHorizontal: 40, gap: 12, borderRadius: tuned.components.button.radius });
    expect(label).toMatchObject({ ...textStyle(tuned, 'titleMedium'), color: tuned.color.light.onPrimary, textTransform: 'uppercase' });
  });

  it('defaults to the theme variant and md size', () => {
    const { container } = buttonStyles(base, { mode: 'light' });
    expect(container).toMatchObject({ minHeight: 40, paddingHorizontal: 24, backgroundColor: base.color.light.primary });
  });

  it('resolves variant roles per mode, with the variant elevation as shadow', () => {
    const light = buttonStyles(tuned, { variant: 'tonal', mode: 'light' });
    const dark = buttonStyles(tuned, { variant: 'tonal', mode: 'dark' });
    expect(light.container.backgroundColor).toBe(tuned.color.light.accentContainer);
    expect(light.label.color).toBe(tuned.color.light.onAccentContainer);
    expect(dark.container.backgroundColor).toBe(tuned.color.dark.accentContainer);
    expect(dark.label.color).toBe(tuned.color.dark.onAccentContainer);
    expect(light.container.backgroundColor).not.toBe(dark.container.backgroundColor);
    expect(light.container).toMatchObject(shadow(tuned, 2, 'light'));
  });

  it('handles transparent: no border width, transparent colors', () => {
    const filled = buttonStyles(tuned, { variant: 'filled', mode: 'light' }).container;
    expect(filled).toMatchObject({ borderWidth: 0, borderColor: 'transparent' });
    const outlined = buttonStyles(tuned, { variant: 'outlined', mode: 'dark' }).container;
    expect(outlined).toMatchObject({ borderWidth: 2, borderColor: tuned.color.dark.outline, backgroundColor: 'transparent', elevation: 0 });
    expect(buttonStyles(tuned, { variant: 'text', mode: 'light' }).container.backgroundColor).toBe('transparent');
  });

  it('disabled drops border and shadow and uses disabled content', () => {
    const { container, label } = buttonStyles(tuned, { variant: 'tonal', mode: 'light', disabled: true });
    expect(container).toMatchObject({ borderWidth: 0, elevation: 0, shadowOpacity: 0 });
    expect(container.backgroundColor).toBe(`${tuned.color.light.onSurface.slice(0, 7)}1f`);
    expect(label.color).toBe(tuned.color.light.onSurfaceDisabled);
  });

  it('respects cut corners but keeps pills', () => {
    expect(globex.shape.cornerStyle).toBe('cut');
    expect(cornerRadius(globex, 8)).toBe(0);
    expect(cornerRadius(globex, globex.shape.radius.full)).toBe(globex.shape.radius.full);
    expect(cornerRadius(base, 8)).toBe(base.shape.cornerStyle === 'cut' ? 0 : 8);
    const cut = structuredClone(globex);
    cut.components.button.radius = 6;
    expect(buttonStyles(cut, { mode: 'light' }).container.borderRadius).toBe(0);
  });
});

describe('inputStyles', () => {
  const tuned = tunedTheme();

  it('applies paddingX, border width, label gap, height and radius', () => {
    const s = inputStyles(tuned, { variant: 'outlined', mode: 'light' });
    expect(s.wrapper).toEqual({ gap: 6, opacity: 1 });
    expect(s.field).toMatchObject({
      minHeight: tuned.components.input.height,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderRadius: tuned.components.input.radius,
      borderColor: tuned.color.light.outline,
      backgroundColor: 'transparent',
    });
  });

  it('focus/error thicken and recolor the border; filled has a bottom line only', () => {
    const thick = Math.max(2, tuned.shape.borderWidth.thick);
    expect(inputStyles(tuned, { mode: 'dark', state: 'focused' }).field).toMatchObject({ borderWidth: thick, borderColor: tuned.color.dark.primary });
    expect(inputStyles(tuned, { mode: 'light', state: 'error' }).field.borderColor).toBe(tuned.color.light.error);
    const filled = inputStyles(tuned, { variant: 'filled', mode: 'light' }).field;
    expect(filled).toMatchObject({ borderWidth: 0, borderBottomWidth: 2, borderBottomLeftRadius: 0, backgroundColor: tuned.color.light.surfaceContainerHigh });
    expect(inputStyles(tuned, { mode: 'light', state: 'disabled' }).wrapper.opacity).toBe(tuned.effects.opacity.disabled);
  });
});

describe('chipStyles', () => {
  const tuned = tunedTheme();

  it('applies height, paddingX, icon gap and selected roles per mode', () => {
    const sel = chipStyles(tuned, { selected: true, mode: 'light' });
    expect(sel.container).toMatchObject({ minHeight: 36, paddingHorizontal: 16, gap: 6, borderWidth: 0, backgroundColor: tuned.color.light.primaryContainer });
    expect(sel.label.color).toBe(tuned.color.light.onPrimaryContainer);
    expect(chipStyles(tuned, { selected: true, mode: 'dark' }).container.backgroundColor).toBe(tuned.color.dark.primaryContainer);
    const idle = chipStyles(tuned, { mode: 'light' });
    expect(idle.container).toMatchObject({ backgroundColor: 'transparent', borderColor: tuned.color.light.outline });
  });
});

describe('cardStyle / dialogStyles / badgeStyle', () => {
  const tuned = tunedTheme();

  it('card: padding, gap, radius, elevation shadow and border when bordered', () => {
    const s = cardStyle(tuned, 'light');
    expect(s).toMatchObject({ padding: 24, gap: 12, borderRadius: tuned.components.card.radius, borderWidth: tuned.shape.borderWidth.thin });
    expect(s).toMatchObject(shadow(tuned, tuned.components.card.elevation, 'light'));
    expect(cardStyle(base, 'light')).toMatchObject({ borderWidth: 0, borderColor: 'transparent' });
    expect(cardStyle(tuned, 'dark', 'filled')).toMatchObject({ elevation: 0, borderWidth: 0, backgroundColor: tuned.color.dark.surfaceContainerHigh });
  });

  it('dialog: padding, action gap, radius', () => {
    const s = dialogStyles(tuned, 'dark');
    expect(s.container).toMatchObject({ padding: 32, borderRadius: tuned.components.dialog.radius, backgroundColor: tuned.color.dark.surfaceContainerHigh });
    expect(s.actions.gap).toBe(16);
  });

  it('badge: paddingX and radius', () => {
    expect(badgeStyle(tuned, 'light')).toMatchObject({ paddingHorizontal: 8, borderRadius: tuned.components.badge.radius, backgroundColor: tuned.color.light.error });
    expect(badgeStyle(tuned, 'dark').backgroundColor).toBe(tuned.color.dark.error);
  });
});

describe('themes published before component tuning', () => {
  const legacy = legacyTheme();

  it('produce the same styles as the default fixture', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const variant of ['filled', 'tonal', 'outlined', 'text', 'danger'] as const) {
        for (const size of ['sm', 'md', 'lg'] as const) {
          expect(buttonStyles(legacy, { variant, size, mode })).toEqual(buttonStyles(base, { variant, size, mode }));
        }
      }
      expect(inputStyles(legacy, { mode, state: 'focused' })).toEqual(inputStyles(base, { mode, state: 'focused' }));
      expect(chipStyles(legacy, { selected: true, mode })).toEqual(chipStyles(base, { selected: true, mode }));
      expect(cardStyle(legacy, mode)).toEqual(cardStyle(base, mode));
      expect(dialogStyles(legacy, mode)).toEqual(dialogStyles(base, mode));
      expect(badgeStyle(legacy, mode)).toEqual(badgeStyle(base, mode));
    }
  });
});
