import { describe, expect, it } from 'vitest';
import type { Theme } from '@debdaru07/schema';
import acmeJson from '@debdaru07/schema/fixtures/acme.json' with { type: 'json' };
import defaultJson from '@debdaru07/schema/fixtures/default.json' with { type: 'json' };
import globexJson from '@debdaru07/schema/fixtures/globex.json' with { type: 'json' };
import { easing, easingFunction, radius, screenAnimation, shadow, textStyle, textStyles } from '../src/index.ts';

const acme = acmeJson as unknown as Theme;
const globex = globexJson as unknown as Theme;
const base = defaultJson as unknown as Theme;

describe('textStyle', () => {
  it('maps a style to RN TextStyle with string weights', () => {
    expect(textStyle(acme, 'bodyMedium')).toEqual({
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0.25,
      fontStyle: 'normal',
    });
    expect(textStyle(acme, 'titleLarge').fontWeight).toBe('600');
    expect(textStyle(globex, 'labelLarge').fontFamily).toBe('Nunito Sans');
  });

  it('scales display/headline by responsiveScale for the breakpoint', () => {
    expect(textStyle(acme, 'display', 'mobile')).toMatchObject({ fontFamily: 'Poppins', fontSize: 40.5, lineHeight: 46.8 });
    expect(textStyle(acme, 'headline', 'wide')).toMatchObject({ fontSize: 30.8, lineHeight: 39.6 });
    expect(textStyle(acme, 'display', 'tablet').fontSize).toBe(45);
    expect(textStyle(acme, 'display').fontSize).toBe(45); // no breakpoint: unscaled
  });

  it('does not scale other styles', () => {
    expect(textStyle(acme, 'bodyLarge', 'mobile').fontSize).toBe(16);
    expect(textStyle(acme, 'caption', 'wide').fontSize).toBe(11);
  });

  it('supports a font family resolver (expo-google-fonts naming)', () => {
    const style = textStyle(globex, 'headline', undefined, { fontFamily: (f, w) => `${f.replace(/ /g, '')}_${w}` });
    expect(style.fontFamily).toBe('Merriweather_600');
  });

  it('maps italic, and treats a missing italic (older themes) as normal', () => {
    const italic = structuredClone(acme);
    italic.typography.styles.caption.italic = true;
    expect(textStyle(italic, 'caption').fontStyle).toBe('italic');
    expect(textStyle(italic, 'caption', undefined, { fontFamily: (f, w, i) => `${f}_${w}${i ? 'i' : ''}` }).fontFamily).toBe(
      'Roboto_400i',
    );
    const legacy = structuredClone(acme) as unknown as { typography: { styles: Record<string, { italic?: boolean }> } };
    delete legacy.typography.styles.caption!.italic;
    expect(textStyle(legacy as unknown as Theme, 'caption').fontStyle).toBe('normal');
  });

  it('textStyles returns all 10 styles', () => {
    const all = textStyles(base, 'mobile');
    expect(Object.keys(all)).toHaveLength(10);
    expect(all.display.fontSize).toBe(Math.round(base.typography.styles.display.size * 0.9 * 10) / 10);
  });
});

describe('shadow', () => {
  it('maps a level to iOS shadow props + Android elevation', () => {
    expect(shadow(acme, 1, 'light')).toEqual({
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 1.5,
      elevation: 1,
    });
    expect(shadow(acme, 'level3', 'dark')).toMatchObject({ shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 6 });
    expect(shadow(acme, 5, 'light').elevation).toBe(12);
  });

  it('level 0 is flat', () => {
    expect(shadow(acme, 0, 'light')).toMatchObject({ shadowOpacity: 0, elevation: 0 });
  });

  it('folds 8-digit color alpha into opacity and clamps levels', () => {
    const t: Theme = { ...acme, elevation: { ...acme.elevation, shadowColor: { light: '#11223380', dark: '#000000' } } };
    const s = shadow(t, 9, 'light');
    expect(s.shadowColor).toBe('#112233');
    expect(s.shadowOpacity).toBe(0.1);
    expect(s.elevation).toBe(12);
  });
});

describe('easing', () => {
  it('returns bezier control points', () => {
    expect(easing(acme, 'standard')).toEqual([0.2, 0, 0, 1]);
    expect(easing(acme, 'accelerate')).toEqual([0.3, 0, 1, 1]);
  });

  it('builds Easing.bezier when given RN Easing', () => {
    const calls: number[][] = [];
    const Easing = { bezier: (...args: number[]) => (calls.push(args), (t: number) => t) };
    const fn = easingFunction(acme, 'emphasized', Easing);
    expect(typeof fn).toBe('function');
    expect(calls).toEqual([[0.3, 0, 0, 1]]);
  });
});

describe('screenAnimation', () => {
  const withTransition = (pageTransition: Theme['motion']['pageTransition']): Theme => ({
    ...acme,
    motion: { ...acme.motion, pageTransition },
  });

  it.each([
    ['fade', 'fade'],
    ['slide', 'slide_from_right'],
    ['scale', 'fade_from_bottom'],
    ['sharedAxis', 'slide_from_right'],
    ['none', 'none'],
  ] as const)('%s → %s', (transition, animation) => {
    expect(screenAnimation(withTransition(transition)).animation).toBe(animation);
  });

  it('uses the medium duration (0 for none)', () => {
    expect(screenAnimation(acme)).toEqual({ animation: 'slide_from_right', animationDuration: 250 });
    expect(screenAnimation(globex)).toEqual({ animation: 'fade', animationDuration: 300 });
    expect(screenAnimation(base)).toEqual({ animation: 'slide_from_right', animationDuration: base.motion.duration.medium });
    expect(screenAnimation(withTransition('none')).animationDuration).toBe(0);
  });

  it('honors reduced motion when the theme respects it', () => {
    expect(screenAnimation(acme, { reducedMotion: true })).toEqual({ animation: 'none', animationDuration: 0 });
    const optOut: Theme = { ...acme, motion: { ...acme.motion, respectReducedMotion: false } };
    expect(screenAnimation(optOut, { reducedMotion: true }).animation).toBe('slide_from_right');
  });
});

describe('radius', () => {
  it('returns raw radii for rounded themes', () => {
    expect(radius(acme, 'md')).toBe(8);
    expect(radius(acme, 'lg')).toBe(16);
    expect(radius(acme, 'full')).toBe(9999);
    expect(radius(acme, 'none')).toBe(0);
  });

  it('cut themes render square corners, keep pills, and can opt out', () => {
    expect(globex.shape.cornerStyle).toBe('cut');
    expect(radius(globex, 'md')).toBe(0);
    expect(radius(globex, 'full')).toBe(9999);
    expect(radius(globex, 'md', { cut: 'radius' })).toBe(4);
  });
});
