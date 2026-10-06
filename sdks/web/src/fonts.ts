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

/** Family → sorted weights used by the theme (fontFamily slots get 400/500/600/700). */
export function themeFontWeights(theme: Theme): Map<string, number[]> {
  const map = new Map<string, Set<number>>();
  const add = (family: string, weight: number) => {
    if (SYSTEM_FAMILIES.has(family.toLowerCase())) return;
    let set = map.get(family);
    if (!set) map.set(family, (set = new Set()));
    set.add(weight);
  };
  const ff = theme.typography.fontFamily;
  for (const family of [ff.primary, ff.secondary, ff.mono]) for (const w of [400, 500, 600, 700]) add(family, w);
  for (const s of Object.values(theme.typography.styles)) add(s.family, s.weight);
  return new Map([...map].map(([f, ws]) => [f, [...ws].sort((a, b) => a - b)]));
}

/**
 * Google Fonts CSS2 URLs — one per family, so a weight a family lacks only affects that family.
 */
export function googleFontsUrls(theme: Theme): string[] {
  return [...themeFontWeights(theme)].map(
    ([family, weights]) =>
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights.join(';')}&display=swap`,
  );
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
