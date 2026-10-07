# Dynamic Theming System

Multi-tenant theming for SaaS products. An agency (tenant) builds one product and sells it to many clients, and
each client gets its own brand. Clients edit their theme in **Theme Studio**, see it live on phone, tablet and
desktop, and publish. Apps pick up the new theme at runtime through the SDKs, with no rebuild or store release.

```text
platform defaults → tenant base theme → client theme  ──resolve──►  GET /v1/theme  ──►  Flutter · Web · React · React Native
```

Design and decisions: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository

| Path | What |
| --- | --- |
| [packages/schema](packages/schema) | Token schema (Zod), platform defaults, resolver, color generation, contrast checks, JSON Schema, shared test themes |
| [apps/server](apps/server) | Theme API: Fastify + libSQL (SQLite locally, Turso in production), auth and roles, drafts, publishing, history, public SDK endpoint |
| [apps/site](apps/site) | Product and SDK documentation site (Astro Starlight) |
| [apps/admin](apps/admin) | Theme Studio: React admin with a live preview |
| [sdks/flutter](sdks/flutter) | `theme_studio`: ThemeData, `context.dt` tokens, adaptive navigation, page transitions, example app |
| [sdks/web](sdks/web) | `@debdaru07/web`: client, cache, CSS variables (`--dts-*`) |
| [sdks/react](sdks/react) | `@debdaru07/react`: `<ThemeProvider>` and hooks |
| [sdks/react-native](sdks/react-native) | `@debdaru07/react-native`: provider, hooks, style helpers |

## Quick start

Requires Node 22.13+ (24 recommended). Flutter 3.38+ is only needed for the Flutter SDK.

```sh
npm install
npm run dev:server   # API on http://localhost:8787, seeds demo data on first run
npm run dev:admin    # Theme Studio on http://localhost:5173
```

Demo logins (also offered as buttons on the sign-in page in dev):

| Role | Email | Password |
| --- | --- | --- |
| Tenant admin (Northwind Studio) | owner@northwind.test | northwind123 |
| Client editor (Acme only) | editor@acme.test | acme12345 |
| Platform admin | admin@dts.local | admin12345 |

Demo publishable keys: `pk_demo_acme`, `pk_demo_globex`.

```sh
curl -H "X-Theme-Key: pk_demo_globex" http://localhost:8787/v1/theme
```

Flutter example against the local API:

```sh
cd sdks/flutter/example
flutter run -d chrome --dart-define=DTS_ENDPOINT=http://localhost:8787
```

Docker (API and admin): `docker compose up --build`. Set `JWT_SECRET` for anything beyond a local demo.

## Deploy (free tier)

API on Render, database on Turso, Theme Studio and the docs site on Cloudflare Pages. Step-by-step checklist:
[docs/DEPLOY.md](docs/DEPLOY.md). The server uses libSQL, so locally it's a SQLite file (`file:data/dts.db`,
override with `DATABASE_URL`) and in production it's Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`).

## Development

```sh
npm test             # all JS/TS workspaces
npm run typecheck
npm run fixtures     # regenerate packages/schema/fixtures + theme.schema.json after schema changes
cd sdks/flutter && dart tool/sync_fixtures.dart && flutter test && flutter analyze
```

Flutter's live API test runs when `DTS_LIVE_ENDPOINT=http://localhost:8787` is set and the API is running.

**Windows:** `flutter test` and `flutter build` fail when the Flutter SDK path contains a space (for example
`C:\Flutter SDK`), because a native-assets build hook pulled in by `path_provider` breaks on it. Install Flutter
at a path without spaces, or run it through a directory junction (`mklink /J C:\flutter "C:\Flutter SDK"`).

## Who can change what

Clients change brand colors, fonts, layout spacing, shape, motion, navigation, component variants and brand
assets. Agencies also control text sizes, weights, elevation, component sizing and effects. The platform owns the
spacing scale, breakpoints and touch targets. See `POLICY` in [packages/schema/src/policy.ts](packages/schema/src/policy.ts).

Editors act at their own role's level on any theme they can open. An agency admin can set agency-level tokens
(say, a larger button height) on one client's theme; that client's editors keep the value but can't change or
remove it. Locked fields in Theme Studio show who manages them.

Core text/background color pairs must pass WCAG AA (4.5:1) to publish; other pairs only warn.
