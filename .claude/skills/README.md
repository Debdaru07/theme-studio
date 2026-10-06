# Project skills: UI, marketing and taste

Three Claude Code skills for this repo. They load automatically when a task matches their description, or you
can call them directly with `/functional-ui`, `/marketing-page` or `/design-taste`.

| Skill | Use it to | Bundled files |
| --- | --- | --- |
| [`functional-ui`](functional-ui/SKILL.md) | Build or review UI that works everywhere: accessibility (WCAG 2.2 AA), responsive tiers, touch, states, motion, performance | `checklist.md`, `scripts/audit.mjs` (`npm run audit:ui`) |
| [`marketing-page`](marketing-page/SKILL.md) | Plan and write the landing page, feature sections, announcements and social cards | `facts.md`: the only claims copy may make |
| [`design-taste`](design-taste/SKILL.md) | Make and defend visual decisions; critique pages with a scored rubric | `direction.md`: Theme Studio's design direction |

They are written for this project from the ideas in Snyk's
[Top Claude Skills for UI/UX Engineers](https://snyk.io/articles/top-claude-skills-ui-ux-engineers/) (Anthropic
Frontend Design, Vercel Web Design Guidelines, UI/UX Pro Max, Bencium, AccessLint). No third-party skill code is
included. The only script is `functional-ui/scripts/audit.mjs`, which drives a local browser against
localhost URLs.

## Working on the docs landing page

Start the docs site (`npm run dev:site`, http://localhost:4321) and give directions like these:

**Critique first**
> /design-taste critique the docs landing page at 390px and 1280px in light and dark, and give me the top 3 changes

**Rework the hero**
> /marketing-page rework the landing hero for agency leads: outcome headline, one primary CTA, live demo beside the copy on desktop. Follow design-taste's direction.

**Rewrite a section's copy**
> /marketing-page rewrite the "What you get" section as benefits for agencies vs developers, using only facts.md

**Add metadata**
> /marketing-page add Open Graph, Twitter card and SoftwareApplication JSON-LD to the landing page, and set `site` in astro.config.mjs

**Verify before pushing**
> /functional-ui audit the docs site and fix anything that fails

Combine them in one request when that's natural ("…using marketing-page and design-taste, then verify with
functional-ui"). Each skill's checklist ends with a "before you ship" list.

## Keeping them honest

- **New product capability:** add it to `marketing-page/facts.md`, with its source file, before writing about it.
- **New screen or flow:** add it to `TARGETS` in `functional-ui/scripts/audit.mjs`.
- **Changed visual direction:** edit `design-taste/direction.md` in the same PR as the design change.
- **Third-party skills:** review `SKILL.md` and every script before adding one. Snyk found prompt injection in
  36% of the public skills it tested.
