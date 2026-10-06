// Regenerates src/editor/google-fonts.json from Google Fonts' public metadata (no API key needed).
// Run: npm run fonts -w @dts/admin
import { writeFileSync } from 'node:fs';

const res = await fetch('https://fonts.google.com/metadata/fonts');
if (!res.ok) throw new Error(`Google Fonts metadata: HTTP ${res.status}`);
const { familyMetadataList } = JSON.parse((await res.text()).replace(/^\)\]\}'\s*/, ''));

const CATEGORY = { 'Sans Serif': 'sans', Serif: 'serif', Display: 'display', Handwriting: 'handwriting', Monospace: 'mono' };

const fonts = familyMetadataList
  .filter((f) => CATEGORY[f.category] && !f.family.includes('Icons') && !f.family.startsWith('Material Symbols'))
  .sort((a, b) => a.popularity - b.popularity)
  .map((f) => {
    const keys = Object.keys(f.fonts);
    // The schema allows CSS weights 100–900.
    const weights = [...new Set(keys.map((k) => Number.parseInt(k, 10)))]
      .filter((w) => w >= 100 && w <= 900 && w % 100 === 0)
      .sort((a, b) => a - b);
    // Compact keys keep the bundle small: f=family, c=category, w=weights, i=has italics.
    return { f: f.family, c: CATEGORY[f.category], w: weights, i: keys.some((k) => k.endsWith('i')) };
  });

const out = new URL('../src/editor/google-fonts.json', import.meta.url);
writeFileSync(out, JSON.stringify(fonts));
console.log(`wrote ${fonts.length} families`);
