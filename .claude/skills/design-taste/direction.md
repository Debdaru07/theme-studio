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
- Alternative if Bricolage feels too loud: **Instrument Serif** for headlines only (editorial, calm). Pick one
  and record it here; never both.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Accent | `#3B5BDB` (light) / `#8EA4FF` (dark) | Primary actions, links, focus rings — nothing else |
| Canvas | `#F6F7F9` / `#0F1115` | Page background |
| Surface | `#FFFFFF` / `#171A20` | Cards, panels |
| Text | `#16181D` / `#E8EAEE`; muted `#5D6573` / `#9AA3B2` | All muted text ≥ 4.5:1 |
| Brand spectrum | `#3B5BDB` `#E8590C` `#0F766E` `#7C3AED` | Only in the brand mark and *inside* product demos (they are client palettes) — never as page decoration or gradients |

No gradients on text or page backgrounds. The conic brand mark is the only multicolor element in our chrome.

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
