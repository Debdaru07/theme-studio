#!/usr/bin/env node
/**
 * Builds one JS package into a publish-ready folder: <package>/dist.
 *
 *   node scripts/pack.mjs web            # schema | web | react | react-native
 *   npm publish sdks/web/dist            # (the release workflow does this from a tag)
 *
 * Source package.json files keep exporting TypeScript for local development; the staged package.json points at
 * compiled JS + .d.ts, pins workspace dependencies to their current versions, and drops scripts/devDependencies.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES = {
  schema: 'packages/schema',
  web: 'sdks/web',
  react: 'sdks/react',
  'react-native': 'sdks/react-native',
};
/** Extra files (besides compiled src) each package ships, relative to the package. */
const ASSETS = {
  schema: ['fixtures', 'theme.schema.json'],
  web: ['src/components.css'],
  react: ['src/components.css'],
  'react-native': [],
};
const REPO = 'https://github.com/Debdaru07/theme-studio';
/**
 * Optional peers that are not installed in this monorepo and are typechecked against a local stand-in
 * (react-native → test/react-native-mock.ts). The build compiles the stand-in to a declaration-only stub so it is
 * neither emitted nor published; the emitted JS still imports the real module.
 */
const TYPE_STUBS = { 'react-native': { 'react-native': 'test/react-native-mock.ts' } };

const id = process.argv[2];
if (!(id in PACKAGES)) {
  console.error(`Usage: node scripts/pack.mjs <${Object.keys(PACKAGES).join(' | ')}>`);
  process.exit(1);
}
const dir = join(ROOT, PACKAGES[id]);
const out = join(dir, 'dist');
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

// Versions of every workspace package, to pin "*" dependencies.
const workspaceVersions = Object.fromEntries(
  Object.values(PACKAGES).map((p) => {
    const j = JSON.parse(readFileSync(join(ROOT, p, 'package.json'), 'utf8'));
    return [j.name, j.version];
  }),
);

// 1. Compile src → dist (JS + declarations). Tests are not included.
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const tsconfig = join(dir, 'tsconfig.build.json');
const tsc = (project) => execFileSync(process.execPath, [join(ROOT, 'node_modules/typescript/bin/tsc'), '-p', project], { stdio: 'inherit', cwd: dir });
const paths = {};
const stubDir = join(dir, '.types-stub');
for (const [module, file] of Object.entries(TYPE_STUBS[id] ?? {})) {
  const stubConfig = join(dir, 'tsconfig.stub.json');
  writeFileSync(
    stubConfig,
    JSON.stringify({
      extends: './tsconfig.json',
      compilerOptions: { noEmit: false, emitDeclarationOnly: true, declaration: true, rootDir: dirname(file), outDir: '.types-stub' },
      include: [file],
    }),
  );
  try {
    tsc(stubConfig);
  } finally {
    rmSync(stubConfig, { force: true });
  }
  paths[module] = [`./.types-stub/${basename(file).replace(/\.tsx?$/, '.d.ts')}`];
}
writeFileSync(
  tsconfig,
  JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        noEmit: false,
        declaration: true,
        allowImportingTsExtensions: false,
        rewriteRelativeImportExtensions: true,
        rootDir: 'src',
        outDir: 'dist',
        types: [],
        ...(Object.keys(paths).length ? { paths } : {}),
      },
      include: ['src'],
      exclude: ['src/**/*.test.*'],
    },
    null,
    2,
  ),
);
try {
  tsc(tsconfig);
} finally {
  rmSync(tsconfig, { force: true });
  rmSync(stubDir, { recursive: true, force: true });
}

// 2. Assets, README and LICENSE.
for (const asset of ASSETS[id]) cpSync(join(dir, asset), join(out, asset.replace(/^src\//, '')), { recursive: true });
for (const file of ['README.md', 'CHANGELOG.md']) if (existsSync(join(dir, file))) cpSync(join(dir, file), join(out, file));
const license = existsSync(join(dir, 'LICENSE')) ? join(dir, 'LICENSE') : join(ROOT, 'LICENSE');
if (existsSync(license)) cpSync(license, join(out, 'LICENSE'));
else console.warn('warning: no LICENSE file; add one at the repository root before publishing');

// 3. Publish manifest.
const mapExport = (target) => {
  if (target.endsWith('.ts')) {
    const base = target.replace(/^\.\/src\//, './').replace(/\.tsx?$/, '');
    return { types: `${base}.d.ts`, default: `${base}.js` };
  }
  return target.replace(/^\.\/src\//, './');
};
const pin = (deps) =>
  deps &&
  Object.fromEntries(Object.entries(deps).map(([name, range]) => [name, range === '*' && workspaceVersions[name] ? `^${workspaceVersions[name]}` : range]));

const manifest = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  license: pkg.license ?? 'SEE LICENSE IN LICENSE',
  type: 'module',
  repository: { type: 'git', url: `git+${REPO}.git`, directory: PACKAGES[id] },
  homepage: `${REPO}#readme`,
  bugs: { url: `${REPO}/issues` },
  keywords: ['theming', 'design-tokens', 'white-label', 'multi-tenant', 'runtime-theming'],
  sideEffects: pkg.sideEffects ?? false,
  exports: Object.fromEntries(Object.entries(pkg.exports).map(([k, v]) => [k, mapExport(v)])),
  dependencies: pin(pkg.dependencies),
  peerDependencies: pkg.peerDependencies,
  peerDependenciesMeta: pkg.peerDependenciesMeta,
  // Provenance is added by the release workflow (--provenance); a local first publish can't generate it.
  publishConfig: { access: 'public' },
};
writeFileSync(join(out, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Packed ${manifest.name}@${manifest.version} → ${PACKAGES[id]}/dist`);
