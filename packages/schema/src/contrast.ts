import type { ColorRole, ColorScheme } from './tokens.ts';

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance. Alpha is ignored; pairs we check are opaque. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastPair {
  fg: ColorRole;
  bg: ColorRole;
  /** Minimum ratio. 4.5 = WCAG AA body text; 3 = AA non-text UI. */
  min: number;
  /** Core pairs block publishing; others warn. */
  core: boolean;
}

const pairsFor = (role: string, core: boolean): ContrastPair[] => {
  const c = role.charAt(0).toUpperCase() + role.slice(1);
  return [
    { fg: `on${c}` as ColorRole, bg: role as ColorRole, min: 4.5, core },
    { fg: `on${c}Container` as ColorRole, bg: `${role}Container` as ColorRole, min: 4.5, core: false },
  ];
};

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: 'onSurface', bg: 'surface', min: 4.5, core: true },
  { fg: 'onSurface', bg: 'background', min: 4.5, core: true },
  ...pairsFor('primary', true),
  ...pairsFor('secondary', true),
  ...pairsFor('accent', true),
  ...pairsFor('success', false),
  ...pairsFor('warning', false),
  ...pairsFor('error', false),
  ...pairsFor('info', false),
  { fg: 'onSurface', bg: 'surfaceContainerHigh', min: 4.5, core: false },
  { fg: 'onSurfaceMuted', bg: 'surface', min: 4.5, core: false },
  { fg: 'onSurfaceMuted', bg: 'background', min: 4.5, core: false },
  { fg: 'outline', bg: 'surface', min: 3, core: false },
  { fg: 'focusRing', bg: 'background', min: 3, core: false },
];

export interface ContrastIssue {
  mode: 'light' | 'dark';
  fg: ColorRole;
  bg: ColorRole;
  ratio: number;
  min: number;
  level: 'error' | 'warning';
}

export interface ContrastReport {
  /** True when no core pair fails, so the theme may be published. */
  publishable: boolean;
  issues: ContrastIssue[];
}

export function checkContrast(color: { light: ColorScheme; dark: ColorScheme }): ContrastReport {
  const issues: ContrastIssue[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const scheme = color[mode];
    for (const p of CONTRAST_PAIRS) {
      const ratio = contrastRatio(scheme[p.fg], scheme[p.bg]);
      if (ratio < p.min) {
        issues.push({
          mode,
          fg: p.fg,
          bg: p.bg,
          ratio: Math.round(ratio * 100) / 100,
          min: p.min,
          level: p.core ? 'error' : 'warning',
        });
      }
    }
  }
  return { publishable: !issues.some((i) => i.level === 'error'), issues };
}
