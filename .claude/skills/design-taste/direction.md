# Theme Studio design direction

Status: proposed baseline (2026-10). Change it deliberately — update this file in the same PR as the design.

## Point of view

**The product is the proof.** Theme Studio sells the ability to make one product look like many brands. So our
own surfaces stay quiet and precise, and the color, personality and motion come from *showing themes change*:
the live demo, the device preview, real client palettes. Our chrome is the gallery wall, not the painting.

**Feeling:** precise · calm · quietly playful (the playful part is the theme switch).

**Signature moment:** a theme visibly re-skinning a real UI (Acme ↔ Globex, light ↔ dark) — on the landing
page hero and in Theme Studio's preview.

## Typography

| Role | Choice | Why |
| --- | --- | --- |
| Product UI (Theme Studio, docs body) | **Inter** 400/500/600 | Legibility at small sizes, tabular numbers, neutral so client fonts stand out in previews |
| Marketing display (landing headlines, section titles) | **Bricolage Grotesque** 600–800 (Google Fonts, variable) | Characterful grotesque with optical sizing; distinct from default UI type without being decorative |
| Code | **JetBrains Mono** | Already the platform default mono token |

- Display scale on the landing: 56/64 → 40/48 → 28/36 (desktop); clamp() down to 36/42 on phones.
- `text-wrap: balance` on headings, `text-wrap: pretty` on hero copy. Measure 60–70ch.
- **Decision (2026-10-07): Bricolage Grotesque** (700 for headlines, 600 for sub-heads) on landing headings and
  docs page titles (`h1#_top`); docs section headings stay Inter 600. Instrument Serif remains the fallback if
  Bricolage proves too loud — swap it, never use both.
- Small labels (eyebrows, section kickers, token readouts) use JetBrains Mono 500 at 13px in the muted text color.
- Tokens live in `apps/site/src/styles/custom.css`; landing layout in `landing.css` and `src/components/landing/*`.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Accent | `#3B5BDB` (light) / `#8EA4FF` (dark) | Primary actions, links, focus rings — nothing else |
| Canvas | `#F6F7F9` / `#0F1115` | Page background |
| Surface | `#FFFFFF` / `#171A20` | Cards, panels |
| Text | `#16181D` / `#E8EAEE`; muted `#5D6573` / `#9AA3B2` | All muted text ≥ 4.5:1 |
| Brand spectrum | `#3B5BDB` `#E8590C` `#0F766E` `#7C3AED` | Only *inside* product demos (they are client palettes) — never as page decoration or gradients |

No gradients on text or page backgrounds. Our chrome has no multicolor elements.

## Brand mark (decision 2026-10-07)

Source files in `brand/` (`mark.svg` light, `mark-dark.svg` dark, `mark-mono.svg` currentColor).

- Three shapes sharing the bottom-left corner on a 32-unit grid: squares of 32 and 22 units and a 12-unit dot,
  all with a 6-unit corner. They stand for platform defaults → agency base theme → client theme.
- One color makes the mark: the two larger shapes are 30% and 62% of the brand color mixed toward the ground.
  Light: `#C4CEF4` `#8699E9` `#3B5BDB`. Dark: `#353D5B` `#5E6CA6` `#8EA4FF`. On a brand-colored ground: white at
  32% / 62% / 100%.
- Wordmark: "Theme Studio" in Bricolage Grotesque 700, −2% tracking. Mark ≈ 1.4× cap height; gap = ⅓ of the mark.
- Clear space: the dot's width on every side. Smallest size 16px. Never recolor the layers separately, add
  gradients, rotate or outline it.
- Naming: **Theme Studio** is the product; *Studio* the editor app, *Theme API* the service, *Theme Studio SDKs*
  the packages. "Dynamic Theming System" is retired.

**Light only on the docs site and landing (decision 2026-10-07).** The site always renders the light column above
(Starlight's `ThemeProvider` / `ThemeSelect` are overridden; no theme picker). Dark values stay listed for Theme
Studio's own chrome. Dark mode still appears *inside* demos, because it is a client theme setting.

## Docs reading experience

Modelled on developer docs people rate highly (Stripe, Tailwind, Vercel, Supabase):

- Page head: mono section eyebrow (sidebar group) → Bricolage title → `description` as the lead → *Copy page*
  (copies `/<slug>.md`). Every docs page needs a `description`.
- Compact heading scale (h2 24px, h3 19px); prose links underlined; inline code as a hairline chip; code in
  headings plain; table names never break mid-word (tables scroll sideways on phones).
- Header: Docs · SDKs · API text links with the current section marked, *Theme Studio ↗* as the one bordered
  action, GitHub icon. Sidebar: small group labels, tinted current row. TOC: a rail with the active item marked.
- Code blocks: one light theme (`github-light`), 10px radius, hairline border, file-name tabs.
- For tools: `/llms.txt` indexes the docs; every page is also served as Markdown at `/<slug>.md`.
- Edit links point at GitHub on docs pages (off on the landing).

## Layout

- Landing hero: **left-aligned copy + live demo on the right** at ≥ 1024px; stacked (copy, then demo) on
  phones. Not centered.
- Max content width 1200px; 12-column grid with 24px gutters (16px on phones).
- Alternate section rhythm: text-led section → product-led section (demo, preview screenshot, code) → text-led.
- Feature lists as a two-column "benefit + how" layout or a compact table — not rows of identical icon cards.

## Shape, depth, detail

- Radii: 6px (controls), 10px (cards), 14px (device frames, sheets). Pills only for status and toggles.
- One shadow: `0 1px 2px rgb(16 24 40 / .06), 0 4px 16px rgb(16 24 40 / .06)`; device frames may use a
  stronger single shadow to read as objects.
- Icons: one set, 1.5–2px stroke, optical size matched to text. No emoji as icons.
- Borders `1px` in a neutral line color; prefer spacing over borders to group content.

## Motion

- Signature: theme switch in the demo — 250ms crossfade of colors, typography swaps without layout shift.
- Page load: at most one staggered reveal of the hero (≤ 400ms total). Everything else ≤ 200ms.
- Reduced motion: switch instantly, no reveals.

## Voice (visual copy)

Sentence case. Short headings that state outcomes. Numbers with units. See marketing-page for words to avoid.
