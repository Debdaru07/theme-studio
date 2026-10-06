// Copies the generated JSON Schema into public/ so the site serves it at /theme.schema.json.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../packages/schema/theme.schema.json');
const dest = resolve(here, '../public/theme.schema.json');
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log('copied theme.schema.json → public/');
