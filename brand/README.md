# Theme Studio brand

| File | Use |
| --- | --- |
| `mark.svg` | Light grounds (favicons, docs header, Studio top bar) |
| `mark-dark.svg` | Dark grounds |
| `mark-mono.svg` | One color, inherits `currentColor` |

**Mark.** Three shapes share the bottom-left corner on a 32-unit grid: squares of 32 and 22 units and a 12-unit dot,
all with a 6-unit corner. They are the theme layers: platform defaults → agency base theme → client theme. The two
larger shapes are 30% and 62% of the brand color mixed toward the ground, so one color makes the whole mark.

**Wordmark.** "Theme Studio" in Bricolage Grotesque 700, −2% tracking. Mark ≈ 1.4× cap height; gap ≈ ⅓ of the mark.

**Family lockups.** The mark never changes; a descriptor after a 1px hairline says where you are.

| Surface | Lockup |
| --- | --- |
| Landing page (root domain) | Theme Studio |
| Docs pages | Theme Studio \| Docs (descriptor in Inter 500, muted) |
| Studio app | Theme Studio (the breadcrumb carries location) |

The header action that opens the app is labelled "Open Studio", so "Theme Studio" appears once per header.

**Rules.** Clear space = the dot's width on every side. Smallest size 16px. Never recolor layers separately, add
gradients, rotate or outline the mark.

Full guidance: `.claude/skills/design-taste/direction.md` (Brand mark).
