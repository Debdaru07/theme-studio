# Theme Studio — Architecture & MVP Plan

Status: **MVP built (phases 0–6)** · 2026-10-06. Setup and commands are in the [README](../README.md).

## 1. What we are building

A multi-tenant theming platform:

```text
Platform (us)
└── Tenant  (a company subscribing to the platform)
    ├── Base theme      (the tenant's product look)
    └── Client          (each customer the tenant pitches / sells to)
        └── Client theme (partial overrides of the tenant base theme)
```

Three deliverables:

| Deliverable | Stack | Purpose |
| --- | --- | --- |
| **Admin app** | React + TypeScript (Vite) | Tenants and clients edit themes with a live visual preview, then publish. |
| **Theme API** | Node (Fastify) + SQLite | Stores tenants, clients, draft/published theme versions. Serves resolved themes to SDKs. |
| **SDKs** | Flutter (primary), Web (TS + CSS vars), React, React Native | Apps fetch the client's published theme at runtime and apply it natively. |

**Themes apply at runtime.** A published change reaches apps without a rebuild or a store release.

## 2. Repository layout (monorepo)

```text
/packages
  /schema          @debdaru07/schema   – token schema (Zod), defaults, resolver, color derivation,
                                   contrast checks, JSON Schema export, conformance fixtures
/apps
  /server          @dts/server   – Fastify REST API, libSQL (SQLite locally / Turso), seed data
  /site            @dts/site     – product & SDK docs (Astro Starlight)
  /admin           @dts/admin    – React admin + live preview
/sdks
  /web             @debdaru07/web            – framework-agnostic core: fetch, cache, CSS variables
  /react           @debdaru07/react          – <ThemeProvider>, useTheme(), useToken()
  /react-native    @debdaru07/react-native   – Provider + hooks, RN-ready style values
  /flutter         theme_studio        – Dart package: ThemeData, ThemeExtension, widgets
/docs
```

JS packages use npm workspaces. The Flutter package lives in the same repo but is built with `flutter`/`dart`.
`@dts` / `theme_studio` are placeholder names (see Open Questions).

## 3. Key design decisions

1. **One source of truth for tokens.** The schema is written in Zod inside `@debdaru07/schema`. A JSON Schema
   is generated from it so non-TS SDKs (Dart) and external tools can validate themes.
2. **The server resolves themes; SDKs stay thin.** Defaults, tenant base, client overrides,
   token references (`"{shape.radius.md}"`) and derived colors are all resolved on the server.
   SDKs receive a **fully resolved, flat-valued theme** and only map it to their platform.
   The logic is written once in TS rather than reimplemented in four languages.
3. **Shared conformance fixtures.** `packages/schema/fixtures/*.json` holds resolved themes that
   every SDK's test suite must parse and map. This keeps the four SDKs consistent.
4. **Seed-based colors with overrides.** A client can supply only `primary`. The rest
   (`onPrimary`, containers, the dark mode palette) is derived with Material's HCT tonal palettes
   (`@material/material-color-utilities`). This is the same algorithm Flutter's
   `ColorScheme.fromSeed` uses, so the Flutter output matches. Any derived token can be overridden.
5. **Light/dark are modes, not token suffixes.** The notes used `surfaceDark`/`onSurfaceDark`.
   We replace that with `color.light.*` and `color.dark.*` holding identical token names.
   Components never branch on mode.
6. **Override policy is enforced by the schema.** Following `spacing.txt`, clients may
   change brand and layout tokens but not component ergonomics. Each token group has a policy
   (`platform` | `tenant` | `client`), enforced on save by the API and shown as locked in the admin.
7. **Versioned and immutable once published.** Editing writes a *draft*. Publishing creates an immutable
   version. Rollback re-publishes an old version. SDKs only ever see published versions.

## 4. Token schema (v1)

The schema fixes the gaps found in the notes: empty brand-text/brand-surface groups, mismatched
semantic colors, too few surface levels, no outline/disabled/focus tokens, too few text styles,
and an ambiguous 4px/8px grid.

| Category | Tokens (v1) | Editable by |
| --- | --- | --- |
| **color** (per mode `light`/`dark`) | Brand: `primary`, `secondary`, `accent` + `on*` + `*Container` + `on*Container` · Surface: `background`, `surface`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh` · Text: `onSurface`, `onSurfaceMuted`, `onSurfaceDisabled` · Lines: `outline`, `outlineMuted` · Semantic: `success`, `warning`, `error`, `info` + `on*` + `*Container` · Misc: `focusRing`, `scrim` | client |
| **typography** | `fontFamily.primary` / `secondary` / `mono` · 10 styles: `display`, `headline`, `titleLarge`, `titleMedium`, `bodyLarge`, `bodyMedium`, `bodySmall`, `labelLarge`, `labelMedium`, `caption` — each with `family`, `size`, `weight`, `lineHeight`, `letterSpacing` · `responsiveScale` per breakpoint (display/headline only) | fonts: client · styles: tenant |
| **spacing** | 4px grid. Scale: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `2xl 32`, `3xl 48` · Layout (per breakpoint): `pagePadding`, `sectionGap`, `cardGap`, `contentMaxWidth` · Component: `cardPadding`, `dialogPadding`, `listGap`, `formGap` | scale: platform · layout + card/dialog padding: client · other component: tenant |
| **sizing** | `breakpoints` (`mobile <600`, `tablet <1024`, `desktop <1440`, `wide`) · `icon` sm/md/lg · `controlHeight` sm/md/lg · `minTouchTarget` (48) | platform |
| **shape** | `radius` none/xs/sm/md/lg/xl/full · `borderWidth` thin/thick · `cornerStyle` (rounded / cut) | client |
| **elevation** | levels 0–5 (shadow color, blur, offset, spread per mode) · `zIndex` (dropdown, sticky, overlay, modal, toast) | tenant |
| **motion** | `duration` short/medium/long · `easing` standard/emphasized/decelerate/accelerate (cubic-bezier) · `pageTransition` (`fade` / `slide` / `scale` / `sharedAxis` / `none`) · `respectReducedMotion` | client |
| **navigation** | `pattern` per breakpoint (`bottomBar` / `rail` / `drawer` / `topTabs` / `sidebar`) · `showLabels` (always / selected / never) · `indicator` (pill / underline / none) · `appBar` (`centeredTitle`, `elevated`) | client |
| **components** | `button` (radius ref, height ref, `variant` filled/tonal/outlined, `textTransform`) · `input` (`variant` filled/outlined, radius ref) · `card` (radius ref, elevation ref, border on/off) · `dialog` · `chip` · `badge` | tenant (client may switch variants) |
| **effects** | `opacity` hover/pressed/disabled · `focusRing` width/offset · `blur` sm/md · `gradient.brand` (optional) | tenant |
| **assets** | `logo` light/dark URL · `favicon` · `appName` | client |
| *icons/illustrations* | **Deferred to v2.** | — |

Component tokens may reference other tokens (`"radius": "{shape.radius.md}"`). The resolver replaces
references with literal values before the theme reaches an SDK.

Abbreviated example of what an SDK receives:

```json
{
  "schemaVersion": 1,
  "meta": { "tenant": "northwind", "client": "acme", "version": 7, "publishedAt": "2026-10-06T09:00:00Z", "hash": "0a2bf3a7c02c4617" },
  "color": {
    "light": { "primary": "#3B5BDB", "onPrimary": "#FFFFFF", "primaryContainer": "#DCE1FF", "...": "..." },
    "dark":  { "primary": "#B6C4FF", "onPrimary": "#00287A", "...": "..." }
  },
  "typography": { "fontFamily": { "primary": "Inter" }, "styles": { "bodyMedium": { "size": 14, "weight": 400, "lineHeight": 20, "letterSpacing": 0.25 } } },
  "spacing": { "scale": { "xs": 4, "sm": 8 }, "layout": { "mobile": { "pagePadding": 16 }, "desktop": { "pagePadding": 32 } } },
  "motion": { "duration": { "short": 150, "medium": 250, "long": 400 }, "pageTransition": "sharedAxis" },
  "navigation": { "pattern": { "mobile": "bottomBar", "tablet": "rail", "desktop": "sidebar" } }
}
```

## 5. Theme resolution

```text
platform defaults ─┐
tenant base theme ─┼─► deep merge ─► resolve {refs} ─► derive missing colors ─► validate ─► resolved theme
client overrides  ─┘                                                            (schema + contrast)
```

* **Validation** rejects schema violations and changes the caller's role may not make.
* **Contrast** (WCAG 2.1): failing *core* text/background pairs block publishing. All other failing pairs are
  shown as warnings in the admin (see §11.4).
* The published, resolved JSON is stored with its hash and served with an `ETag`.

## 6. Theme API (Node + SQLite)

Tables: `tenants`, `users` (role: `platform_admin` | `tenant_admin` | `client_editor`, scoped to tenant/client),
`clients` (with a public `publishable_key`), `theme_drafts`, `theme_versions` (immutable, resolved JSON + hash).

| Endpoint | Who |
| --- | --- |
| `POST /auth/login` → JWT | admin users |
| `GET/POST/PATCH /tenants`, `/tenants/:id/clients` | platform / tenant admin |
| `GET/PUT /tenants/:id/base-theme/draft` · `POST …/publish` | tenant admin |
| `GET/PUT /clients/:id/theme/draft` | tenant admin, client editor |
| `POST /clients/:id/theme/preview` → resolved theme + contrast report (not saved) | admin app live preview |
| `POST /clients/:id/theme/publish` · `GET …/versions` · `POST …/versions/:v/rollback` | tenant admin, client editor |
| **`GET /v1/theme`** (header `X-Theme-Key: pk_…`) → resolved published theme, `ETag`, `Cache-Control` | **SDKs** (public, read-only) |

Publishing the tenant base theme re-resolves every client that inherits from it.

## 7. Admin app (React + TS)

* **Screens:** login → tenant dashboard (clients list) → theme editor → versions/history.
* **Editor layout:** category tabs on the left (Colors, Typography, Spacing, Shape, Elevation, Motion,
  Navigation, Components, Effects, Assets) · **live preview** on the right · contrast warnings inline ·
  locked tokens shown with a lock and the reason.
* **Live preview:** uses `@debdaru07/react` scoped to the preview container (CSS variables on an element, not `:root`),
  so it is the same code path apps use. It provides:
  * Device frames (mobile / tablet / desktop), which also switch the **navigation pattern**
  * Light/dark toggle
  * Sample screens: sign-in, dashboard with cards, list + detail (shows the **page transition**), form with validation states, dialog, toasts
  * "Play motion" button to replay transitions with the current durations and easings
* **Publish flow:** diff of draft vs published, then publish, then the version appears in history with rollback.
* **v2 option:** a second preview tab embedding the Flutter example app compiled to web, which receives the draft
  theme via `postMessage`. That gives a pixel-exact Flutter preview.

## 8. SDKs

All four follow the same lifecycle:

```text
init(key, endpoint) → load cached theme (instant) → render
                    → fetch /v1/theme with If-None-Match → if changed: cache + re-render
fallback order: network → cache → bundled default theme
```

| SDK | API surface |
| --- | --- |
| **Flutter** `theme_studio` | `DynamicTheme.init(...)` · `DynamicThemeApp`/`DynamicThemeBuilder` provide `ThemeData` (light+dark: `ColorScheme`, `TextTheme`, component themes) · `ThemeExtension<DtTokens>` for tokens Material lacks (`context.dt.spacing.md`, `context.dt.motion…`) · `DtPageTransitionsBuilder` (from `motion.pageTransition`) · `DtAdaptiveScaffold` (bottom bar / rail / drawer / sidebar from `navigation.pattern` per breakpoint) · cache via `shared_preferences` · fonts via `google_fonts` |
| **Web** `@debdaru07/web` | `createThemeClient({ key, endpoint })` · `applyTheme(theme, { root, mode })` writes `--dts-color-primary`, `--dts-space-md`, … · follows `prefers-color-scheme` · `localStorage` cache · optional Tailwind preset (v2) |
| **React** `@debdaru07/react` | `<ThemeProvider client={…}>` · `useTheme()` · `useToken('color.primary')` · `useBreakpoint()` · `useNavigationPattern()` |
| **React Native** `@debdaru07/react-native` | `<ThemeProvider>` · `useTheme()` (numbers and colors ready for `StyleSheet`) · pluggable storage (AsyncStorage adapter) · motion helpers for `Animated`/Reanimated · navigation pattern for React Navigation |

## 9. Build order

| Phase | Output | Done when |
| --- | --- | --- |
| 0 | Monorepo scaffold, tooling (TS, lint, test), `git init` | `npm test` runs across workspaces |
| 1 | `@debdaru07/schema`: Zod schema, defaults, resolver, color derivation, contrast, JSON Schema, fixtures | Unit tests for merge/refs/derivation/policy/contrast pass |
| 2 | `@dts/server`: DB, auth, CRUD, draft/publish/versions, public endpoint, demo seed (1 tenant, 2 clients) | API tests pass; `curl /v1/theme` returns a resolved theme with ETag |
| 3 | **Flutter SDK** + example app | Fixture tests pass; example switches between the two demo clients live |
| 4 | Admin app with editor, live preview, publish, history | A demo client can be re-themed and published end to end, and the Flutter example picks it up |
| 5 | Web, React, React Native SDKs + examples | Fixture tests pass; examples render both demo clients |
| 6 | Docker Compose (api + admin), docs, integration guides per SDK | `docker compose up` runs the full demo |

## 10. Out of scope for the MVP

Billing and subscriptions, SSO, custom font uploads (Google Fonts only), icon and illustration theming,
real-time push (SDKs refresh on launch and resume, plus an optional poll interval) and multi-region hosting.
The SDKs are published on npm (`@debdaru07/*`) and pub.dev (`theme_studio`); see [PUBLISHING.md](PUBLISHING.md).

## 11. Decisions (2026-10-06)

1. **Names (updated 2026-10-08):** npm packages are `@debdaru07/{schema,web,react,react-native}` (the `@dts` scope
   belongs to someone else) and the Flutter package is `theme_studio` (`dynamic_theme` is taken on pub.dev). Private
   apps keep their internal `@dts/admin`, `@dts/server`, `@dts/site` names.
2. **Publishing:** client editors can publish their own client theme. The version history records who published it.
3. **Fonts:** Google Fonts only for the MVP. Custom font uploads will be scoped later.
4. **Contrast:** *core pairs* must pass WCAG AA 4.5:1 or publishing is blocked. Core pairs are
   `onSurface`/`surface`, `onSurface`/`background`, and `on{Primary,Secondary,Accent}`/`{primary,secondary,accent}`,
   checked in both modes. Every other pair is a warning only.
5. **Dev packaging:** JS workspace packages export their TypeScript source directly (run with `tsx`, Vite and Vitest).
   `scripts/pack.mjs` builds the publishable npm packages (JS + `.d.ts` in `<package>/dist`), and tags release them
   through trusted publishing; see [PUBLISHING.md](PUBLISHING.md).
6. **Database:** libSQL via `@libsql/client`. It's a local SQLite file in development and Turso in production, with
   the same SQL in both. It sits behind a small repository layer (`apps/server/src/repo.ts`). It replaced
   `node:sqlite` so the API can run on free hosts that have no persistent disk.
7. **Permissions are checked per changed token, at the editor's role** (`validateLayerChange`). An agency admin
   may set agency-level tokens on one client's theme; that client's editors keep them but cannot change them.
   Publishing only checks that tokens exist.
8. **Typography:** the font picker covers the Google Fonts catalog (`apps/admin/scripts/build-fonts.mjs`
   regenerates the list). Weight choices are limited to the weights a family ships, and every text style has an
   `italic` flag. SDKs treat a missing `italic` as `false`, so themes cached before it existed still load.
9. **Hosting (free tier):** API on Render, DB on Turso, admin and docs on Cloudflare Pages. See [DEPLOY.md](DEPLOY.md).
