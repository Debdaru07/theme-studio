/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as react from '@debdaru07/react';
import { describe, expect, it } from 'vitest';
import { COMPONENT_SETUP, COMPONENTS } from './components.ts';
import { SDKS } from './sdks.ts';

/** The component docs may only show APIs that exist in sdks/*. */
const read = (path: string) => readFileSync(fileURLToPath(new URL(`../../../../${path}`, import.meta.url)), 'utf8');
const css = read('sdks/web/src/components.css');
const rnSource = read('sdks/react-native/src/components.tsx');
const flutterSource = ['widgets/components.dart', 'widgets/dt_button.dart', 'models/components.dart']
  .map((f) => read(`sdks/flutter/lib/src/${f}`))
  .join('\n');

/** App code in examples (the reader's own components and icons), not SDK APIs. */
const PLACEHOLDERS = new Set(['SearchIcon', 'PlusIcon', 'BellIcon', 'TruckIcon', 'Summary', 'Tracking', 'Invoice', 'OrderCard', 'Routes', 'Navigation', 'Home']);
const tags = (code: string) => [...new Set([...code.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]!))].filter((t) => !PLACEHOLDERS.has(t));

describe('component docs', () => {
  it('cover every SDK for every component', () => {
    const ids = SDKS.map((s) => s.id);
    for (const c of COMPONENTS) {
      for (const id of ids) expect(c.code[id]?.trim(), `${c.name} · ${id}`).toBeTruthy();
      expect(c.props.length, c.name).toBeGreaterThan(0);
      expect(c.a11y.length, c.name).toBeGreaterThan(0);
    }
    for (const id of ids) expect(COMPONENT_SETUP[id]).toBeDefined();
  });

  it('Web examples only use classes defined in @debdaru07/web/components.css', () => {
    for (const c of COMPONENTS) {
      for (const [, cls] of c.code.web.matchAll(/class="([^"]+)"/g)) {
        for (const name of cls!.split(/\s+/).filter((n) => n.startsWith('dts-'))) {
          expect(css, `${c.name}: .${name}`).toMatch(new RegExp(`\\.${name}(?![\\w-])`));
        }
      }
    }
  });

  it('React examples only use @debdaru07/react exports', () => {
    for (const c of COMPONENTS) {
      for (const tag of tags(c.code.react)) expect(react, `${c.name}: <${tag}>`).toHaveProperty(tag);
    }
  });

  it('React Native examples only use @debdaru07/react-native components', () => {
    for (const c of COMPONENTS) {
      for (const tag of tags(c.code['react-native'])) {
        expect(rnSource, `${c.name}: <${tag}>`).toMatch(new RegExp(`export function ${tag}\\(`));
      }
    }
  });

  it('Flutter examples only use widgets and functions the SDK defines', () => {
    for (const c of COMPONENTS) {
      for (const [, name] of `${c.code.flutter}\n${c.flutter}`.matchAll(/\b((?:show)?Dt[A-Z]\w*)\b/g)) {
        expect(flutterSource, `${c.name}: ${name}`).toMatch(new RegExp(`(class|enum|Future<\\w+>|ScaffoldFeatureController<[^>]+>) ${name}\\b`));
      }
    }
  });
});
