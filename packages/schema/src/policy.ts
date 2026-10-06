/**
 * Who may edit which tokens. Each layer may edit a path when its role is at least as privileged
 * as the path's policy. Follows the notes: clients customise brand and layout, not component ergonomics.
 */
export type Layer = 'platform' | 'tenant' | 'client';

const RANK: Record<Layer, number> = { platform: 0, tenant: 1, client: 2 };

/** Patterns are dot paths; `*` matches one segment. The most specific (longest) match wins. */
export const POLICY: ReadonlyArray<readonly [pattern: string, editableBy: Layer]> = [
  ['color', 'client'],
  ['typography.fontFamily', 'client'],
  ['typography.styles', 'tenant'],
  ['typography.responsiveScale', 'tenant'],
  ['spacing.scale', 'platform'],
  ['spacing.layout', 'client'],
  ['spacing.component.cardPadding', 'client'],
  ['spacing.component.dialogPadding', 'client'],
  ['spacing.component', 'tenant'],
  ['sizing', 'platform'],
  ['shape', 'client'],
  ['elevation', 'tenant'],
  ['motion', 'client'],
  ['navigation', 'client'],
  ['components', 'tenant'],
  ['components.*.variant', 'client'],
  ['effects', 'tenant'],
  ['assets', 'client'],
];

function matches(pattern: string[], path: string[]): boolean {
  if (pattern.length > path.length) return false;
  return pattern.every((seg, i) => seg === '*' || seg === path[i]);
}

/** The least-privileged layer allowed to edit `path`. Unlisted paths are platform-only. */
export function editableBy(path: string): Layer {
  const segs = path.split('.');
  let best: { len: number; layer: Layer } = { len: -1, layer: 'platform' };
  for (const [pattern, layer] of POLICY) {
    const p = pattern.split('.');
    if (matches(p, segs) && p.length > best.len) best = { len: p.length, layer };
  }
  return best.layer;
}

export function canEdit(layer: Layer, path: string): boolean {
  return RANK[layer] <= RANK[editableBy(path)];
}
