import { deriveScheme, normalizeHex } from './color.ts';
import { checkComponents, type ComponentReport } from './components.ts';
import { checkContrast, type ContrastReport } from './contrast.ts';
import { PLATFORM_DEFAULTS } from './defaults.ts';
import { deepMerge, getPath, isPlainObject, leafPaths } from './paths.ts';
import { canEdit, editableBy, type Layer } from './policy.ts';
import {
  SCHEMA_VERSION,
  SEED_KEYS,
  ThemeSchema,
  seedOf,
  type ColorRole,
  type ColorSeeds,
  type Theme,
  type ThemeInput,
  type ThemeMeta,
} from './tokens.ts';

export interface ThemeIssue {
  path: string;
  message: string;
}

export class ThemeValidationError extends Error {
  constructor(public readonly issues: ThemeIssue[]) {
    super(`Invalid theme:\n${issues.map((i) => `  ${i.path}: ${i.message}`).join('\n')}`);
    this.name = 'ThemeValidationError';
  }
}

export interface ResolvedTheme {
  theme: Theme;
  contrast: ContrastReport;
  /** Component tuning guardrails; errors block publishing like contrast errors. */
  components: ComponentReport;
}

const REF = /^\{([A-Za-z0-9_.]+)\}$/;

// ── Layer validation ─────────────────────────────────────────────────────────

let knownPaths: Set<string> | undefined;

function getKnownPaths(): Set<string> {
  if (!knownPaths) {
    const { theme } = resolveTheme([]);
    const { schemaVersion: _v, meta: _m, ...tokens } = theme;
    knownPaths = new Set([...leafPaths(tokens), ...SEED_KEYS.map((k) => `color.seed.${k}`)]);
  }
  return knownPaths;
}

/**
 * Checks a stored layer: every path must exist and, when `editor` is given, be editable by it.
 * Value checks happen when the layer is resolved.
 */
export function validateLayer(input: unknown, editor?: Layer): ThemeIssue[] {
  if (!isPlainObject(input)) return [{ path: '', message: 'Theme layer must be an object' }];
  const known = getKnownPaths();
  const issues: ThemeIssue[] = [];
  for (const path of leafPaths(input)) {
    if (!known.has(path)) {
      // A whole sub-object replaced by a reference or array lands here too.
      issues.push({ path, message: 'Unknown token' });
    } else if (editor && !canEdit(editor, path)) {
      issues.push({ path, message: lockedMessage(path) });
    }
  }
  return issues;
}

/**
 * Checks an edit from `prev` to `next` made by `editor`. Only tokens that changed (including
 * removed ones) must be editable, so a client editor keeps tokens their agency set on their theme
 * but cannot change or remove them.
 */
export function validateLayerChange(prev: unknown, next: unknown, editor: Layer): ThemeIssue[] {
  const issues = validateLayer(next);
  if (!isPlainObject(next)) return issues;
  const unknown = new Set(issues.map((i) => i.path));
  const before = isPlainObject(prev) ? prev : {};
  for (const path of new Set([...leafPaths(before), ...leafPaths(next)])) {
    if (unknown.has(path)) continue;
    const changed = JSON.stringify(getPath(before, path)) !== JSON.stringify(getPath(next, path));
    if (changed && !canEdit(editor, path)) issues.push({ path, message: lockedMessage(path) });
  }
  return issues;
}

const lockedMessage = (path: string) => `Locked: only ${editableBy(path)} level may change this token`;

// ── Resolution ───────────────────────────────────────────────────────────────

/**
 * Resolves layers (lowest first, e.g. `[tenantBase, clientOverrides]`) on top of the platform
 * defaults into a complete, validated theme.
 *
 * Color rule: a layer that changes a seed drops explicit color overrides from *lower* layers that
 * were derived from that seed, so a client's new brand color is not hidden by the tenant's old tweaks.
 */
export function resolveTheme(layers: ThemeInput[], meta?: ThemeMeta): ResolvedTheme {
  const all: ThemeInput[] = [PLATFORM_DEFAULTS as ThemeInput, ...layers];
  const issues: ThemeIssue[] = [];

  const seeds: ColorSeeds = {};
  const overrides = { light: {} as Record<string, string>, dark: {} as Record<string, string> };
  const rest: unknown[] = [];

  for (const layer of all) {
    const { color, ...others } = layer;
    rest.push(others);
    if (!color) continue;
    for (const [k, v] of Object.entries(color.seed ?? {})) {
      if (v === undefined) continue;
      try {
        seeds[k as keyof ColorSeeds] = normalizeHex(v);
      } catch (e) {
        issues.push({ path: `color.seed.${k}`, message: (e as Error).message });
        continue;
      }
      for (const mode of ['light', 'dark'] as const) {
        for (const token of Object.keys(overrides[mode])) {
          if (seedOf(token as ColorRole) === k) delete overrides[mode][token];
        }
      }
    }
    for (const mode of ['light', 'dark'] as const) {
      for (const [token, v] of Object.entries(color[mode] ?? {})) {
        if (v === undefined) continue;
        try {
          overrides[mode][token] = normalizeHex(v);
        } catch (e) {
          issues.push({ path: `color.${mode}.${token}`, message: (e as Error).message });
        }
      }
    }
  }
  if (issues.length) throw new ThemeValidationError(issues);

  const tree = {
    schemaVersion: SCHEMA_VERSION,
    ...deepMerge<Record<string, unknown>>(...rest),
    color: {
      light: { ...deriveScheme(seeds, 'light'), ...overrides.light },
      dark: { ...deriveScheme(seeds, 'dark'), ...overrides.dark },
    },
    ...(meta ? { meta } : {}),
  };

  const resolved = resolveRefs(tree, issues);
  if (issues.length) throw new ThemeValidationError(issues);

  const parsed = ThemeSchema.safeParse(resolved);
  if (!parsed.success) {
    throw new ThemeValidationError(
      parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return { theme: parsed.data, contrast: checkContrast(parsed.data.color), components: checkComponents(parsed.data) };
}

/** Replaces `{path}` strings with the referenced value. `chain[0]` is the leaf being resolved. */
function resolveRefs(root: Record<string, unknown>, issues: ThemeIssue[]): unknown {
  const walk = (node: unknown, chain: string[]): unknown => {
    if (typeof node === 'string') {
      const target = REF.exec(node)?.[1];
      if (!target) return node;
      if (chain.includes(target)) {
        issues.push({ path: chain[0]!, message: `Circular reference: ${[...chain, target].join(' → ')}` });
        return undefined;
      }
      const value = getPath(root, target);
      if (value === undefined) {
        issues.push({ path: chain[0]!, message: `Unknown reference {${target}}` });
        return undefined;
      }
      return walk(value, [...chain, target]);
    }
    if (Array.isArray(node)) return node.map((v) => walk(v, chain));
    if (isPlainObject(node)) return mapValues(node, (v) => walk(v, chain));
    return node;
  };

  const top = (node: unknown, path: string): unknown =>
    isPlainObject(node)
      ? mapValues(node, (v, k) => top(v, path ? `${path}.${k}` : k))
      : walk(node, [path]);

  return top(root, '');
}

const mapValues = (o: Record<string, unknown>, fn: (v: unknown, k: string) => unknown) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fn(v, k)]));
