# @debdaru07/schema

[![npm](https://img.shields.io/npm/v/@debdaru07/schema)](https://www.npmjs.com/package/@debdaru07/schema) [![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Debdaru07/theme-studio/blob/main/packages/schema/LICENSE)

The theme model behind Theme Studio: token types, platform defaults, the layer resolver, palette generation and the
WCAG contrast checks. The Theme API, Theme Studio and the SDKs all use this package, so a theme resolves the same
way everywhere.

[Docs](https://theme-studio-docs.debdarudasgupta0799.workers.dev/concepts/tokens/) · [Theme Studio](https://theme-studio.debdarudasgupta0799.workers.dev) · [GitHub](https://github.com/Debdaru07/theme-studio)

Most apps don't need it directly: the SDKs ([web](https://www.npmjs.com/package/@debdaru07/web),
[React](https://www.npmjs.com/package/@debdaru07/react), [React Native](https://www.npmjs.com/package/@debdaru07/react-native),
[Flutter](https://pub.dev/packages/theme_studio)) receive themes that the API has already resolved. Use it to resolve
or validate themes yourself: in a build step, a test, a design tool, or your own server.

## Install

```sh
npm install @debdaru07/schema
```

## Resolve a theme from layers

Layers apply in order on top of the platform defaults: agency base theme, then client overrides. One brand color is
enough; light and dark palettes are generated from it (Material HCT tonal palettes).

```ts
import { resolveTheme } from '@debdaru07/schema';

const agency = { typography: { fontFamily: { primary: 'Inter' } }, assets: { appName: 'Northwind' } };
const client = { color: { seed: { primary: '#0F766E' } }, assets: { appName: 'Globex Care' } };

const { theme, contrast } = resolveTheme([agency, client]);

theme.color.light.primary;   // '#0F766E', plus generated onPrimary, containers, surfaces…
theme.color.dark.primary;    // '#80D5CB': the dark palette, generated from the same seed
contrast.publishable;        // false if a core text/background pair fails WCAG AA (4.5:1)
```

`resolveTheme` throws `ThemeValidationError` (with an `issues` list of `{ path, message }`) for invalid values.

## What's inside

| Export | Purpose |
| --- | --- |
| `resolveTheme(layers, meta?)` | Merge layers over `PLATFORM_DEFAULTS`, resolve `{references}`, derive palettes, validate. Returns `{ theme, contrast }` |
| `validateLayer(layer, editor?)`, `validateLayerChange(prev, next, editor)` | Unknown tokens and permission checks per role |
| `checkContrast(color)`, `contrastRatio(a, b)`, `CONTRAST_PAIRS` | WCAG checks; core pairs block publishing, others warn |
| `deriveScheme(seeds, mode)`, `normalizeHex(hex)` | Palette generation from seed colors |
| `POLICY`, `canEdit(layer, path)`, `editableBy(path)` | Who may change which token: platform, agency (tenant) or client |
| `PLATFORM_DEFAULTS`, `SCHEMA_VERSION`, token types (`Theme`, `ThemeInput`, `ColorRole`, …) | The model itself |
| `@debdaru07/schema/fixtures/*.json` | Resolved example themes (`default`, `acme`, `globex`) for tests and demos |

The JSON Schema for a resolved theme is published at
[theme.schema.json](https://theme-studio-docs.debdarudasgupta0799.workers.dev/theme.schema.json).

## License

MIT © Debdaru07
