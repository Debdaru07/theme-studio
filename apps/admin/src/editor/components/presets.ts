import { getPath, setPath, type ThemeInput } from '@debdaru07/schema';

/**
 * One-click starting points that set several component values at once. "Default" removes those values so
 * every component follows the theme again. All numbers sit on the 4px grid and pass the guardrails.
 */
type Patch = Record<string, unknown>;

export const DENSITY = {
  compact: {
    'components.button.sizes.sm.height': 28,
    'components.button.sizes.sm.paddingX': 12,
    'components.button.sizes.md.height': 36,
    'components.button.sizes.md.paddingX': 16,
    'components.button.sizes.lg.height': 44,
    'components.button.sizes.lg.paddingX': 24,
    'components.input.height': 40,
    'components.input.paddingX': 12,
    'components.chip.height': 28,
    'components.chip.paddingX': 8,
    'components.card.padding': 12,
    'components.dialog.padding': 20,
  },
  default: null,
  comfortable: {
    'components.button.sizes.sm.height': 36,
    'components.button.sizes.sm.paddingX': 16,
    'components.button.sizes.md.height': 44,
    'components.button.sizes.md.paddingX': 24,
    'components.button.sizes.lg.height': 52,
    'components.button.sizes.lg.paddingX': 32,
    'components.input.height': 52,
    'components.input.paddingX': 16,
    'components.chip.height': 36,
    'components.chip.paddingX': 16,
    'components.card.padding': 20,
    'components.dialog.padding': 28,
  },
} satisfies Record<string, Patch | null>;

const r = (step: string) => `{shape.radius.${step}}`;
export const CORNERS = {
  sharp: { button: r('none'), input: r('none'), card: r('none'), dialog: r('xs'), chip: r('none'), badge: r('xs') },
  soft: { button: r('sm'), input: r('xs'), card: r('sm'), dialog: r('md'), chip: r('xs'), badge: r('full') },
  round: { button: r('md'), input: r('sm'), card: r('md'), dialog: r('xl'), chip: r('sm'), badge: r('full') },
  pill: { button: r('full'), input: r('full'), card: r('lg'), dialog: r('xl'), chip: r('full'), badge: r('full') },
} as const;

const cornerPatch = (name: keyof typeof CORNERS): Patch =>
  Object.fromEntries(Object.entries(CORNERS[name]).map(([c, v]) => [`components.${c}.radius`, v]));

const densityPaths = Object.keys(DENSITY.compact);

function apply(layer: ThemeInput, patch: Patch): ThemeInput {
  return Object.entries(patch).reduce((l, [path, v]) => setPath<ThemeInput>(l, path, v), layer);
}

export function applyDensity(layer: ThemeInput, name: keyof typeof DENSITY): ThemeInput {
  const patch = DENSITY[name];
  if (!patch) return densityPaths.reduce((l, path) => setPath<ThemeInput>(l, path, undefined), layer);
  return apply(layer, patch);
}

export function applyCorners(layer: ThemeInput, name: keyof typeof CORNERS): ThemeInput {
  return apply(layer, cornerPatch(name));
}

/** Which preset (if any) the layer currently matches exactly. */
export function activeDensity(layer: ThemeInput): keyof typeof DENSITY | null {
  if (densityPaths.every((p) => getPath(layer, p) === undefined)) return 'default';
  for (const name of ['compact', 'comfortable'] as const) {
    if (Object.entries(DENSITY[name]).every(([p, v]) => getPath(layer, p) === v)) return name;
  }
  return null;
}

export function activeCorners(layer: ThemeInput): keyof typeof CORNERS | null {
  for (const name of Object.keys(CORNERS) as (keyof typeof CORNERS)[]) {
    if (Object.entries(cornerPatch(name)).every(([p, v]) => getPath(layer, p) === v)) return name;
  }
  return null;
}
