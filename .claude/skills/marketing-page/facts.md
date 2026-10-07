# Verified facts for marketing copy

Every claim on a marketing surface must come from this list. Each fact names where it is true in the repo;
re-check the source if the code may have changed, and add new facts here (with a source) before using them.

## Product

| Fact | Source |
| --- | --- |
| Themes are applied at runtime; publishing a change needs no app rebuild or store release | `docs/ARCHITECTURE.md` §1, SDK clients |
| Four SDKs: Flutter (`dynamic_theme`), Web (`@dts/web`, CSS variables), React (`@dts/react`), React Native (`@dts/react-native`) | `sdks/*` |
| Three layers: platform defaults → agency (tenant) base theme → client theme | `packages/schema/src/resolve.ts` |
| A client can give one brand color; light and dark palettes are generated from it (Material HCT tonal palettes) and any color can be overridden | `packages/schema/src/color.ts` |
| Publishing is blocked when core text/background pairs fail WCAG AA (4.5:1); other pairs warn | `packages/schema/src/contrast.ts` |
| Token categories: color, typography, spacing, sizing, shape, elevation, motion, navigation, components, effects, assets | `packages/schema/src/tokens.ts` |
| Navigation patterns per breakpoint: bottom bar, rail, drawer, sidebar, top tabs | `tokens.ts` `NAV_PATTERNS` |
| Page transitions: fade, slide, scale, shared axis, none | `tokens.ts` `PAGE_TRANSITIONS` |
| 10 text styles with per-style weight and italic; font picker covers 1,950 Google Fonts families | `tokens.ts` `TEXT_STYLES`, `apps/admin/src/editor/google-fonts.json` |
| Roles: platform admin, agency (tenant) admin, client editor; agencies can lock tokens their clients cannot change | `packages/schema/src/policy.ts`, `apps/server/src/themes.ts` |
| Drafts autosave; publishing creates an immutable version; one-click rollback; publishing a base theme updates every client built on it | `apps/server/src/themes.ts` |
| SDKs load the cached theme instantly, then revalidate with `ETag` / `If-None-Match` (304 when unchanged), and fall back to a bundled default offline | `sdks/web/src/client.ts`, `sdks/flutter/lib/src/client/client.dart` |
| Live device preview in Theme Studio: phone, tablet, desktop, wide; light and dark | `apps/admin/src/preview/Preview.tsx` |
| Theme Studio works from 320px phones to wide desktops, including phone landscape | `apps/admin/src/styles/responsive.css`, `npm run audit:ui` |
| Open source on GitHub | `PUBLIC_REPO_URL` in `apps/site/src/config.ts` |
| Platform defaults alone resolve to a complete theme with no contrast issues (`resolveTheme([])`) | `packages/schema/src/defaults.ts`, `resolve.ts` |
| Publishable keys (`pk_…`) are read-only and safe to ship in an app | `apps/site/src/content/docs/getting-started.mdx` |
| The theme format has a published JSON Schema at `/theme.schema.json` | `apps/site/scripts/copy-schema.mjs` |

## Stack and hosting

| Fact | Source |
| --- | --- |
| Can run entirely on free tiers: API on Render, database on Turso, Theme Studio and docs on Cloudflare | `docs/DEPLOY.md` |
| Free-tier API sleeps after ~15 min idle; first request takes ~30–60s (apps keep their cached theme meanwhile) | `docs/DEPLOY.md` |
| CI runs typecheck, tests, builds and a security audit on every pull request | `.github/workflows/ci.yml` |

## Not claimable (yet)

- Customer names, logos, testimonials, usage numbers — none exist.
- Packages published to npm / pub.dev — they are not yet (install by path or git).
- Uptime, latency or scale figures — not measured.
- Custom font uploads, icon theming — not built.
