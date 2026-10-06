---
name: design-taste
description: Make deliberate, distinctive visual decisions for Theme Studio instead of generic defaults — typography, color, layout, spacing, motion and detail — guided by the product's design direction, a list of "generic AI UI" tells to avoid, and a scored critique rubric. Use when designing or restyling any page or component (especially the docs landing page and marketing surfaces), when choosing fonts/colors/layout, or when asked whether something "looks good" or "looks generic".
argument-hint: "[page or component to design or critique, e.g. 'critique the landing page']"
---

# Design taste

Taste is a set of decisions you can defend. Before changing pixels, decide the direction; while designing,
remove more than you add; before shipping, score the result and fix the biggest gap first.

## 1. Work from the direction, not from defaults

Read [direction.md](direction.md) — Theme Studio's point of view, type, color, layout and motion choices.
If a request conflicts with it, say so and propose the change to the direction rather than silently drifting.

For a new surface, write three lines before designing:

- **Feeling** — three adjectives this surface must evoke (from direction.md, or justified changes).
- **Signature moment** — the one thing people will remember (e.g. the live re-theme on the landing page).
- **What we're not doing** — the obvious default you're rejecting and why.

## 2. Principles

1. **Hierarchy through contrast of scale, not decoration.** One clear largest element per view; size steps of
   at least 1.25×; weight and color as secondary levers.
2. **Restraint.** One accent color for actions. Two type families at most (display + text). Three font
   weights at most per page. One shadow style. One radius scale.
3. **Rhythm.** Every gap comes from the 4px scale (4, 8, 12, 16, 24, 32, 48, 64, 96). Section spacing grows
   with section importance; related things sit closer than unrelated things (proximity before borders).
4. **Alignment.** Left-align text blocks longer than two lines. Use a grid; break it on purpose, once.
5. **Show the product.** Real UI (the preview, the live demo, real code) beats abstract illustrations,
   gradients and stock icons. Theme Studio's product *is* visual — let it carry the page.
6. **Details compound.** Optical alignment of icons with text, consistent icon stroke, tabular numbers in
   data, hanging punctuation in pull quotes, balanced headline wraps (`text-wrap: balance`), no widows in
   hero copy (`text-wrap: pretty`).
7. **Motion has a job.** It explains a change of state or draws the eye once. One orchestrated moment per
   page; everything else ≤ 200ms and subtle. Honour reduced motion.

## 3. Generic-UI tells — remove on sight

- Everything centered, including long paragraphs and feature grids.
- Purple-to-blue gradient hero, gradient text on headings, glow blobs behind content.
- Three identical cards with an emoji or generic outline icon each, repeated down the page.
- Default system/Inter-only typography on a marketing page with no display face or scale contrast.
- Low-contrast grey body text (< 4.5:1) used to look "minimal".
- Glassmorphism, heavy drop shadows or 24px+ radii on everything without reason.
- Badges/pills sprinkled for decoration ("New!", "AI-powered").
- Filler headlines ("Supercharge your workflow") — see marketing-page banned words.
- Fake UI (lorem dashboards) when the real product could be shown.
- Every section the same height, same layout, same background.

## 4. Critique rubric

Score each 1–5 with one sentence of evidence (cite the element). Screenshots at 390px and 1280px, light and
dark, are required inputs.

| Dimension | 5 looks like |
| --- | --- |
| Hierarchy | Eye path is obvious: headline → proof → action, in under 3 seconds |
| Typography | Purposeful pairing, clear scale, comfortable measure (45–75 characters), no orphan lines |
| Color | One accent, tinted neutrals, semantic colors only for meaning, AA contrast in both modes |
| Space & rhythm | Consistent scale, grouped by proximity, generous but not empty |
| Distinctiveness | Recognisably Theme Studio; passes the "swap the logo" test (it wouldn't fit any other product) |
| Coherence | Docs, landing and Theme Studio feel like one family |
| Craft | Alignment, icon consistency, states, edges at 320px and 1920px |

Finish with **the three changes with the highest impact-to-effort ratio**, in order, each as a concrete edit
(file, element, before → after). Don't list twenty nitpicks.

## 5. Process tricks

- **Squint test** — blur the screenshot; the hierarchy should survive.
- **Remove one thing** — before adding, try deleting an element; keep the deletion if nothing is lost.
- **Grayscale test** — hierarchy and states must survive without color.
- **Three widths** — judge at 390, 768 and 1280 before calling it done (`npm run audit:ui` saves them).
- **Before/after** — always compare side by side; taste is comparative.
