# Functional UI checklist

*Must* items block merging. *Should* items are fixed unless there is a written reason not to.

## 1. Semantics and keyboard

| Level | Check | How to test |
| --- | --- | --- |
| Must | Native elements first: `<button>` for actions, `<a href>` for navigation, `<label>` for every field | Read the markup |
| Must | Tab order follows visual order; nothing reachable is invisible; nothing visible is unreachable | Tab through the page |
| Must | Visible focus ring on every focusable element (`:focus-visible`, ≥ 2px, ≥ 3:1 against background) | Tab; screenshot |
| Must | Escape closes menus, popovers, sheets and dialogs; focus returns to the trigger | Keyboard |
| Must | Dialogs: `role="dialog"`, `aria-modal`, labelled heading, focus moved inside on open | Screen reader / devtools a11y tree |
| Must | Icon-only buttons have `aria-label`; state is exposed (`aria-pressed`, `aria-expanded`, `aria-current`) | Audit: "no accessible name" |
| Should | One `h1` per page; headings don't skip levels | Devtools outline |
| Should | Live regions (`aria-live="polite"`) for async status: "Draft saved", "Publishing…", errors | Screen reader |

## 2. Color and contrast

| Level | Check | How to test |
| --- | --- | --- |
| Must | Body text ≥ 4.5:1; large text (≥ 24px, or ≥ 18.66px bold) and UI boundaries ≥ 3:1 — in light **and** dark | `contrastRatio()` from `@debdaru07/schema`, or devtools |
| Must | Color is never the only signal (errors have text, chips have words, links in text are underlined) | Grayscale screenshot |
| Should | Disabled controls still readable (≥ 3:1) and explain *why* when not obvious (tooltip/hint) | Visual |

## 3. Responsive and touch

| Level | Check | How to test |
| --- | --- | --- |
| Must | No horizontal page scroll from 320px to 1920px, including phone landscape (844×390) | Audit: "horizontal overflow" |
| Must | Primary action reachable without scrolling sideways at every tier | Audit screenshots |
| Must | Touch targets ≥ 44×44px on touch tiers (WCAG 2.5.8 minimum is 24px; 44px is this project's standard) | Audit: "touch targets" |
| Must | Inputs/selects use ≥ 16px text on touch tiers (iOS zooms otherwise) | Audit: "inputs < 16px" |
| Must | `100dvh` (with `100vh` fallback) for full-height layouts; safe-area padding on bars at screen edges | Rotate a phone |
| Should | Long names truncate with `text-overflow: ellipsis` and a `title`, or wrap with `overflow-wrap: anywhere` | Try a 60-char client name |
| Should | Images/media have intrinsic size (`width`/`height` or `aspect-ratio`) so nothing jumps while loading | Throttled network |

## 4. States

Every data-driven view needs all of these, designed — not left to the browser:

| State | Theme Studio example |
| --- | --- |
| Loading | Skeleton or "Loading theme…" in place, not a blank page |
| Slow server | After ~4s: "Waking up the server — this can take up to a minute" (Render free tier) |
| Empty | No clients yet → explain and offer "Add client" |
| Error | Say what failed and what to do; keep the user's input; offer retry |
| Validation | Inline, next to the field, on blur or submit — not on every keystroke for free text |
| Disabled | Explain the reason (locked token → "Managed by your agency") |
| Success | Confirm briefly ("Draft saved", "Published v3"); don't block with a modal |
| Offline / stale | SDKs: cached theme + status; admin: don't lose unsaved edits |

## 5. Forms

- Labels above fields, always visible (placeholders are hints, not labels).
- Correct `type` and `inputmode` (`email`, `url`, `numeric`) and `autocomplete` (`email`, `current-password`).
- Submit on Enter; disable the submit button only while submitting, and show progress.
- Errors are announced (`aria-describedby` to the message, `aria-invalid="true"`).

## 6. Motion

- 150–300ms for feedback, 300–500ms for page transitions; ease-out for entering, ease-in for leaving.
- Animate `transform` and `opacity` only (no width/height/top/left animation).
- `@media (prefers-reduced-motion: reduce)`: remove non-essential motion. The preview follows the *theme's*
  `respectReducedMotion` token instead, because it demonstrates the client's motion settings.

## 7. Performance

- Admin JS budget: keep the main chunk < 200 kB gzip; lazy-load heavy, rarely used data (e.g. the Google Fonts
  catalog) with `import()`.
- Fonts: `display=swap`; preload only the primary UI font; preview fonts load on demand via `@debdaru07/web`.
- No layout thrash in scroll/resize handlers; use `ResizeObserver` / CSS container queries.
- Docs: images in `apps/site/src/assets` (optimized by Astro), not `public/`.

## 8. Dark mode and theming

- Admin chrome: every color comes from a `:root` token that is redefined under `prefers-color-scheme: dark`.
- Preview and live demo: `--dts-*` only, so they render the client's theme rather than ours.
- Check both modes in screenshots before merging.
