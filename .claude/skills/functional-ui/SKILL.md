---
name: functional-ui
description: Build and verify UI that works for everyone on every screen in this repo — accessibility (WCAG 2.2 AA), responsive tiers, touch sizing, complete UI states, motion and performance — then prove it with the bundled browser audit. Use when creating or changing anything in apps/admin, apps/site, the preview, or the SDK example apps, and before merging UI changes.
argument-hint: "[what you are building or reviewing, e.g. 'review the publish dialog']"
---

# Functional UI

A UI is done when it works with a keyboard, a screen reader, a thumb, a 320px phone, a 1920px monitor, a
slow network and an error — not when it looks right in one browser window. This skill is how that is checked
in Theme Studio.

## Workflow

1. **Map the states before writing markup.** For the screen or component, list: default, hover/focus/active,
   loading, empty, error, disabled, success, and "slow server" (the free API sleeps; the first request can take
   up to a minute). Each needs a designed outcome. See `checklist.md` § States.
2. **Build mobile-first with the project's tiers and tokens** (below). No magic numbers: spacing and radii come
   from the admin `:root` tokens or `--dts-*` variables.
3. **Self-review against `checklist.md`.** Fix every *Must* before moving on.
4. **Run the audit** and fix what it reports:
   ```sh
   npm run dev:server & npm run dev:admin & npm run dev:site   # in separate terminals
   npm run audit:ui                 # or: npm run audit:ui -- --only site
   ```
   It checks 10 viewports (320×568 → 1920×1080, incl. phone landscape) for horizontal overflow, touch targets,
   iOS-zoom inputs, unnamed controls, missing alt text, page errors and failed requests, and saves screenshots
   to `.ui-audit/`. **Look at the screenshots** — the script cannot judge layout quality.
5. **Report** findings as `path:line — severity — problem → fix`, most severe first. Severity: *Blocker* (a user
   cannot complete the task), *Major* (WCAG AA failure or broken layout at a supported size), *Minor*.

When adding a screen or flow, add it to `TARGETS` in `scripts/audit.mjs` so the audit covers it.

## Project conventions

| Surface | Where | Rules |
| --- | --- | --- |
| Theme Studio chrome | `apps/admin/src/styles/admin.css` (tokens on `:root`, light + dark), `responsive.css` (tiers) | Neutral chrome so client themes stand out. New controls must work in all four tiers. |
| Preview (client app simulation) | `apps/admin/src/preview/*` | Style **only** with `--dts-*` variables from `@dts/web`; never admin tokens. It doubles as the reference for customer web apps. |
| Docs site | `apps/site/src/styles/custom.css`, Starlight components | Use Starlight variables (`--sl-*`) and components (Tabs, Steps, Cards, Aside) before custom markup. |
| Landing demos | `apps/site/src/components/landing/*` (`AppScreen.tsx` is the themed screen), `apps/site/src/styles/landing.css` | The screen inside a device frame is styled with `--dts-*` only, like the preview; the chrome around it uses `--sl-*` / `--ts-*`. |

**Responsive tiers** (Theme Studio; mirror them for new layouts):

| Tier | Query | Layout |
| --- | --- | --- |
| wide | ≥ 1280px | three columns |
| laptop | 1024–1279px | three narrower columns |
| tablet | 768–1023px | category strip on top; fields \| preview |
| compact | < 768px, or < 1024px wide and ≤ 500px tall | one pane + Edit/Preview switch; dialogs become bottom sheets |

Use container queries (`container: panel / inline-size`) when a component's layout depends on its pane width
rather than the viewport.

**Touch tier** — `@media (pointer: coarse), (max-width: 1023px)`: controls ≥ 44px tall, form text 16px.

## Non-negotiables

- Every interactive element is reachable and operable by keyboard, with a visible `:focus-visible` ring.
- Text contrast ≥ 4.5:1 (3:1 for large text and UI boundaries) in **both** light and dark mode.
- No horizontal page scroll at 320px. Long strings (client names, URLs, hex codes, keys) truncate or wrap.
- Icon-only buttons have `aria-label`; toggles expose state (`aria-pressed` / `aria-expanded` / `aria-current`).
- Motion respects `prefers-reduced-motion`. Durations 150–300ms for UI feedback; no layout-shifting animation.
- Never rely on color alone: errors carry text, status chips carry words.
- Heights use `dvh` (with a `vh` fallback) so mobile browser chrome does not clip layouts; pad for
  `env(safe-area-inset-*)` on edge-anchored bars.

Full list with rationale and how to test each item: [checklist.md](checklist.md).
