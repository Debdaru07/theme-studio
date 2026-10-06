export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export type JsonObject = { [k: string]: Json };

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Dot-path leaves of an object. Arrays and `null` count as leaves. */
export function leafPaths(obj: unknown, prefix = ''): string[] {
  if (!isPlainObject(obj)) return prefix ? [prefix] : [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const p = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) out.push(...leafPaths(v, p));
    else out.push(p);
  }
  return out;
}

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split('.')) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[seg];
  }
  return cur;
}

/** Immutably sets `value` at `path`, creating objects along the way. `undefined` removes the key. */
export function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const src = obj as Record<string, unknown>;
  const copy: Record<string, unknown> = { ...src };
  if (rest.length === 0) {
    if (value === undefined) delete copy[head!];
    else copy[head!] = value;
  } else {
    const child = isPlainObject(src[head!]) ? (src[head!] as object) : {};
    const next = setPath(child, rest.join('.'), value) as Record<string, unknown>;
    if (Object.keys(next).length === 0) delete copy[head!];
    else copy[head!] = next;
  }
  return copy as T;
}

/** Deep merge: objects merge recursively; arrays, primitives and `null` replace; `undefined` is skipped. */
export function deepMerge<T>(...layers: unknown[]): T {
  let out: Record<string, unknown> = {};
  for (const layer of layers) {
    if (!isPlainObject(layer)) continue;
    out = mergeTwo(out, layer);
  }
  return out as T;
}

function mergeTwo(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(a[k]) ? mergeTwo(a[k] as Record<string, unknown>, v) : v;
  }
  return out;
}
