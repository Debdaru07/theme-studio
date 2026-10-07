#!/usr/bin/env node
/**
 * Release guard, run by .github/workflows/release.yml before publishing.
 *   node scripts/release-check.mjs <schema|web|react|react-native|flutter> <version>
 * Fails unless the tag's version equals the package's version, so a tag can only publish what main contains.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = { schema: 'packages/schema', web: 'sdks/web', react: 'sdks/react', 'react-native': 'sdks/react-native', flutter: 'sdks/flutter' };
const [id, version] = process.argv.slice(2);

if (!(id in DIRS) || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? '')) {
  console.error(`Usage: node scripts/release-check.mjs <${Object.keys(DIRS).join('|')}> <x.y.z>`);
  process.exit(1);
}
const dir = join(ROOT, DIRS[id]);
const current =
  id === 'flutter'
    ? /^version:\s*(\S+)/m.exec(readFileSync(join(dir, 'pubspec.yaml'), 'utf8'))?.[1]
    : JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;

if (current !== version) {
  console.error(`Tag version ${version} does not match ${DIRS[id]} version ${current}. Bump the package, merge, then tag.`);
  process.exit(1);
}
console.log(`OK: releasing ${id} ${version} from ${DIRS[id]}`);
