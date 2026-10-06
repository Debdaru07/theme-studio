import { argbFromHex, Hct, hexFromArgb, TonalPalette } from '@material/material-color-utilities';
import { contrastRatio } from './contrast.ts';
import { BRAND_ROLES, SEMANTIC_ROLES, type ColorScheme, type ColorSeeds } from './tokens.ts';

export type Mode = 'light' | 'dark';

/** Normalises `#rgb`, `#rrggbb` and `#rrggbbaa` (any case) to uppercase `#RRGGBB[AA]`. */
export function normalizeHex(input: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
  if (!m) throw new Error(`Invalid color "${input}"`);
  let h = m[1]!;
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return `#${h.toUpperCase()}`;
}

const toHex = (argb: number) => hexFromArgb(argb).toUpperCase();

/** Picks whichever candidate has the higher contrast against `bg`. */
function bestOn(bg: string, candidates: string[]): string {
  return candidates.reduce((best, c) => (contrastRatio(c, bg) > contrastRatio(best, bg) ? c : best));
}

type KeyGroup = [color: string, on: string, container: string, onContainer: string];

/**
 * Brand fidelity: in light mode the role color is the seed itself (clients expect their exact brand
 * hex). Dark mode uses the lighter tone 80 so the color stays readable on dark surfaces.
 */
function keyGroup(seed: string, mode: Mode): KeyGroup {
  const p = TonalPalette.fromInt(argbFromHex(seed));
  const t = (tone: number) => toHex(p.tone(tone));
  if (mode === 'light') {
    const color = normalizeHex(seed).slice(0, 7);
    return [color, bestOn(color, [t(100), t(10)]), t(90), t(10)];
  }
  const color = t(80);
  return [color, bestOn(color, [t(20), t(100)]), t(30), t(90)];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Derives a complete color scheme for one mode from seeds. `primary` must be present. */
export function deriveScheme(seeds: ColorSeeds, mode: Mode): ColorScheme {
  const primary = seeds.primary;
  if (!primary) throw new Error('color.seed.primary is required');

  const out: Record<string, string> = {};
  for (const role of [...BRAND_ROLES, ...SEMANTIC_ROLES]) {
    const seed = seeds[role] ?? primary;
    const [c, on, container, onContainer] = keyGroup(seed, mode);
    out[role] = c;
    out[`on${cap(role)}`] = on;
    out[`${role}Container`] = container;
    out[`on${cap(role)}Container`] = onContainer;
  }

  // Neutrals take the hue from `neutral` (or primary) with low chroma, so surfaces are subtly brand-tinted.
  const neutralSource = Hct.fromInt(argbFromHex(seeds.neutral ?? primary));
  const n = TonalPalette.fromHueAndChroma(neutralSource.hue, Math.min(neutralSource.chroma, 4));
  const nv = TonalPalette.fromHueAndChroma(neutralSource.hue, Math.min(neutralSource.chroma, 8));
  const N = (tone: number) => toHex(n.tone(tone));
  const NV = (tone: number) => toHex(nv.tone(tone));

  const light = mode === 'light';
  const onSurface = light ? N(10) : N(90);
  Object.assign(out, {
    background: light ? N(98) : N(6),
    surface: light ? N(100) : N(10),
    surfaceContainerLow: light ? N(96) : N(12),
    surfaceContainer: light ? N(94) : N(17),
    surfaceContainerHigh: light ? N(92) : N(22),
    onSurface,
    onSurfaceMuted: light ? NV(30) : NV(80),
    onSurfaceDisabled: `${onSurface}61`, // 38% opacity
    outline: light ? NV(50) : NV(60),
    outlineMuted: light ? NV(80) : NV(30),
    focusRing: out.primary!,
    scrim: light ? '#00000052' : '#00000099',
  });
  return out as ColorScheme;
}
