import type { Theme } from '@dts/schema';

const SYSTEM_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  '-apple-system',
  'blinkmacsystemfont',
  'arial',
  'helvetica',
  'helvetica neue',
  'times new roman',
  'georgia',
  'courier new',
  'segoe ui',
]);

export interface FontVariant {
  weight: number;
  italic: boolean;
}

/** Family → sorted variants used by the theme (fontFamily slots get upright 400/500/600/700). */
export function themeFontVariants(theme: Theme): Map<string, FontVariant[]> {
  const map = new Map<string, Map<string, FontVariant>>();
  const add = (family: string, weight: number, italic: boolean) => {
    if (SYSTEM_FAMILIES.has(family.toLowerCase())) return;
    let variants = map.get(family);
    if (!variants) map.set(family, (variants = new Map()));
    variants.set(`${italic ? 1 : 0},${weight}`, { weight, italic });
  };
  const ff = theme.typography.fontFamily;
  for (const family of [ff.primary, ff.secondary, ff.mono]) for (const w of [400, 500, 600, 700]) add(family, w, false);
  for (const s of Object.values(theme.typography.styles)) add(s.family, s.weight, !!s.italic);
  return new Map(
    [...map].map(([f, vs]) => [
      f,
      [...vs.values()].sort((a, b) => Number(a.italic) - Number(b.italic) || a.weight - b.weight),
    ]),
  );
}

/** Family → sorted weights used by the theme, upright and italic combined. */
export function themeFontWeights(theme: Theme): Map<string, number[]> {
  return new Map(
    [...themeFontVariants(theme)].map(([f, vs]) => [f, [...new Set(vs.map((v) => v.weight))].sort((a, b) => a - b)]),
  );
}

/**
 * Google Fonts CSS2 URLs — one per family, so a variant a family lacks only affects that family.
 * The `ital` axis is requested only for families that a style sets in italics.
 */
export function googleFontsUrls(theme: Theme): string[] {
  return [...themeFontVariants(theme)].map(([family, variants]) => {
    const name = encodeURIComponent(family).replace(/%20/g, '+');
    const axes = variants.some((v) => v.italic)
      ? `ital,wght@${variants.map((v) => `${v.italic ? 1 : 0},${v.weight}`).join(';')}`
      : `wght@${variants.map((v) => v.weight).join(';')}`;
    return `https://fonts.googleapis.com/css2?family=${name}:${axes}&display=swap`;
  });
}

/** Inject `<link rel="stylesheet">` tags for the theme's Google Fonts (deduped by href). */
export function loadGoogleFonts(theme: Theme, doc: Document | undefined = typeof document === 'undefined' ? undefined : document): void {
  if (!doc?.head) return;
  for (const href of googleFontsUrls(theme)) {
    const exists = [...doc.head.querySelectorAll<HTMLLinkElement>('link[data-dts-font]')].some((l) => l.getAttribute('href') === href);
    if (exists) continue;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-dts-font', '');
    doc.head.appendChild(link);
  }
}
