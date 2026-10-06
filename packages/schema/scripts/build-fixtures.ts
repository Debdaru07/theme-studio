/**
 * Writes the generated artifacts other languages depend on:
 *  - theme.schema.json  JSON Schema of a resolved theme
 *  - fixtures/*.json    resolved conformance themes every SDK test suite must load
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { DEMO_CLIENTS, DEMO_TENANT_BASE, ThemeSchema, resolveTheme } from '../src/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = (rel: string, data: unknown) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log('wrote', rel);
};

write('theme.schema.json', z.toJSONSchema(ThemeSchema, { target: 'draft-2020-12' }));

const meta = (client: string | null, version: number) => ({
  tenant: 'northwind',
  client,
  version,
  publishedAt: '2026-10-06T00:00:00.000Z',
  hash: `fixture-${client ?? 'base'}-v${version}`,
});

write('fixtures/default.json', resolveTheme([], meta(null, 0)).theme);
for (const [id, { layer }] of Object.entries(DEMO_CLIENTS)) {
  write(`fixtures/${id}.json`, resolveTheme([DEMO_TENANT_BASE, layer], meta(id, 1)).theme);
}
