/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEMO_CLIENTS, DEMO_TENANT_BASE, resolveTheme } from '@debdaru07/schema';
import { cssVarName, toCssVariables, type CssVarPath } from '@debdaru07/web';
import { describe, expect, it } from 'vitest';
import { buildRows } from './reference.ts';
import { SDKS } from './sdks.ts';

/** Keeps the Integrate tab honest: every variable, path and Dart field it shows must exist in the SDKs. */
const layer = DEMO_CLIENTS.acme.layer;
const { theme } = resolveTheme([DEMO_TENANT_BASE, layer]);
const cssVars = new Set(Object.keys(toCssVariables(theme, 'light')));
const rows = buildRows(theme, layer);
const dart = (file: string) =>
  readFileSync(fileURLToPath(new URL(`../../../../sdks/flutter/lib/src/models/${file}`, import.meta.url)), 'utf8');

describe('token reference', () => {
  it('covers every category with rows', () => {
    expect(new Set(rows.map((r) => r.category)).size).toBe(7);
    expect(rows.length).toBeGreaterThan(80);
  });

  it('only shows CSS variables the Web SDK writes', () => {
    for (const r of rows) {
      for (const name of r.access.web.match(/--dts-[a-z0-9-]+/g) ?? []) {
        const expanded = r.access.web.includes('{')
          ? ['family', 'size', 'weight', 'line-height'].map((p) => `${name}${p}`)
          : [name];
        for (const n of expanded) expect(cssVars, `${r.path}: ${n}`).toContain(n);
      }
    }
  });

  it('only uses cssVar() paths that exist', () => {
    for (const r of rows) {
      const m = /^cssVar\('([^']+)'\)$/.exec(r.access.react);
      if (m) expect(cssVars, r.path).toContain(cssVarName(m[1] as CssVarPath));
    }
  });

  it('only uses Flutter fields that exist on the Dart models', () => {
    const colors = dart('color.dart');
    const layout = dart('layout.dart');
    for (const r of rows) {
      const color = /^context\.dt\.colors\.(\w+)$/.exec(r.access.flutter);
      if (color) expect(colors, r.path).toMatch(new RegExp(`final Color ${color[1]};`));
      const space = /^context\.dt\.spacing\.(\w+)$/.exec(r.access.flutter);
      if (space) expect(layout, r.path).toMatch(new RegExp(`final double ${space[1]};`));
    }
  });

  it('marks the tokens a client sets', () => {
    const own = rows.filter((r) => r.set).map((r) => r.path);
    expect(own).toContain('color.primary'); // Acme sets a primary seed
    expect(own).toContain('typography.fontFamily.primary');
    expect(own).toContain('color.accentContainer'); // derived from the accent seed
    expect(own).not.toContain('color.success'); // Acme seeds only primary and accent
    expect(own).not.toContain('motion.duration.short');
  });
});

describe('SDK templates', () => {
  it('reference only CSS variables and cssVar() paths that exist', () => {
    for (const sdk of SDKS) {
      for (const r of sdk.recipes) {
        for (const name of r.code.match(/--dts-[a-z0-9-]+/g) ?? []) expect(cssVars, `${sdk.id} ${r.title}`).toContain(name);
        for (const [, path] of r.code.matchAll(/cssVar\('([^']+)'\)/g)) {
          expect(cssVars, `${sdk.id} ${r.title}: ${path}`).toContain(cssVarName(path as CssVarPath));
        }
      }
    }
  });

  it('fill in the endpoint and key', () => {
    for (const sdk of SDKS) {
      const { code } = sdk.setup('https://api.example.com', 'pk_test_123');
      expect(code, sdk.id).toContain('https://api.example.com');
      expect(code, sdk.id).toContain('pk_test_123');
    }
  });
});
