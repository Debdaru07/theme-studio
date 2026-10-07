# Component tuning — MVP plan

Status: **Phases 1–3 done** (2026-10-08). Phase 4 (docs) to do.

## Goal

Agencies adjust how the SDK components are built — padding, spacing, sizes, radii, variant colors — on top of a
client's theme, and every app using the SDK picks the change up at runtime. The theme stays the source of truth.

## Decisions

| Question | Decision |
| --- | --- |
| Who tunes components | **Agency (tenant) admins.** Client editors keep choosing variants only. Revisit with the auth rework. |
| MVP components | Button, Text field, Card, Chip, Badge, Dialog (the six already in the schema) |
| Touch-target guardrail | **Warn**, don't block: < 24px is an error (WCAG 2.5.8); md/lg < 36px warns; `sm` may be compact |
| Colors | **Theme color roles only** (plus `transparent` for containers/borders) — never hex |

## How the theme stays intact

- Every component value defaults to a `{reference}` into the theme (`button.radius` → `{shape.radius.full}`,
  `card.padding` → `{spacing.component.cardPadding}`). Untouched values follow later theme changes.
- Overrides are per value (one size, one variant), so tuning `button.sizes.lg.paddingX` leaves everything else linked.
- Colors are role names, so palettes, dark mode and contrast checks keep working.
- Precedence: theme → component tuning (Theme Studio) → local props in code.

## Schema (Phase 1 — done)

`packages/schema/src/tokens.ts`, `defaults.ts`, `components.ts`:

| Component | Tunable values |
| --- | --- |
| `button` | `radius`, `borderWidth`, `iconGap`, `textTransform`, default `variant`; `sizes.{sm,md,lg}.{height,paddingX,textStyle}`; `variants.{filled,tonal,outlined,text,danger}.{container,content,border,elevation}` |
| `input` | `variant`, `radius`, `height`, `borderWidth`, `paddingX`, `labelGap` |
| `card` | `radius`, `elevation`, `bordered`, `padding`, `gap` |
| `dialog` | `radius`, `elevation`, `padding`, `actionGap` |
| `chip` | `radius`, `height`, `paddingX`, `iconGap`, `selected.{container,content}` |
| `badge` | `radius`, `paddingX` |

- `button.height` / `button.paddingX` stay and drive `sizes.md`, so older layers keep working.
- `checkComponents()` runs on every resolve (`ResolvedTheme.components`): heights, 4px grid, and text contrast on
  filled variants (error) / transparent variants (warning). The API refuses to publish on errors, like contrast.
- Flutter models parse the new fields and fall back to the same defaults for themes cached before them.

## Phase 2 — SDKs (done)

All SDKs read tuning through a single back-compat entry point (`componentTokens(theme)` in `@debdaru07/web/core`;
Flutter models carry the same defaults), so themes published before tuning render exactly as before.


- **Web** (`@debdaru07/web`): emit per-size/per-variant variables (`--dts-button-lg-height`,
  `--dts-button-tonal-container`, …) and make `components.css` use them instead of hard-coded spacing.
- **React / React Native**: components read the new tokens (RN style helpers per size/variant).
- **Flutter**: `DtButton` sizes/variants and `ThemeData` button/chip/input/card/dialog themes from the tokens.
- Conformance: fixtures with non-default tuning; every SDK test asserts the same values.

## Phase 3 — Theme Studio workspace (done)

Code: `apps/admin/src/editor/components/*` (inspector, presets, token fields, snippets) and
`apps/admin/src/preview/Specimen.tsx`. Clicking a specimen cell selects that size/variant; values linked to a theme
scale step show 🔗 *Theme · md*; a readout shows measured px; the spacing overlay outlines component boxes.


Three panes in the Components tab: component list (with "n custom" counts) · specimen grid (every variant × size ×
state, light/dark, phone/desktop, plus an "in context" strip) · inspector (presets for density and shape; values
show 🔗 *from theme* vs *custom*, pick from the scale or type a value; reset to theme). Spacing overlay, live code
panel (React / Web / RN / Flutter), inline guardrail messages, component changes listed in the publish dialog.

## Phase 4 — Docs and checks

"Customize components" guide; per-component token tables on SDK pages; add the workspace to `npm run audit:ui`;
add the capability to `.claude/skills/marketing-page/facts.md` once it ships.

## Later

Remaining SDK components (Tabs, Alert, Switch, …), per-state colors (hover/pressed), on-canvas drag handles,
per-platform overrides, per-app overrides within one client.
