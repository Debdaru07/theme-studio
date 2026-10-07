---
name: marketing-page
description: Plan, write and build marketing surfaces for Theme Studio — the docs landing page (apps/site/src/content/docs/index.mdx), feature sections, README hero, announcement posts and social cards — with a clear message hierarchy, honest copy built only from verified facts, conversion-focused calls to action and complete SEO/social metadata. Use for any page whose job is to make someone try, adopt or share the product.
argument-hint: "[page or section, e.g. 'rework the landing hero' or 'write the v0.2 announcement']"
---

# Marketing page

A marketing page has one job: move a specific reader to one next step. Everything on it either serves that
step or goes. Pair this skill with **design-taste** for the visual direction and **functional-ui** to verify
the result.

## 1. Pin down the brief (write it at the top of your plan)

- **Reader.** Theme Studio has two:
  - *Agency lead / product owner* (buyer): sells one product to many clients and wants each to feel bespoke
    without forking code. Cares about speed to pitch, client self-service, brand control, cost.
  - *Developer* (integrator): wires the SDK into a Flutter / web / React / React Native app. Cares about
    time-to-first-theme, API shape, offline behaviour, bundle size, lock-in.
- **Job of the page** — one sentence, e.g. "Get a developer to render a live theme in their app in 5 minutes."
- **Primary action** — exactly one (e.g. *Open Theme Studio*), plus at most one secondary (*Read the docs*).
- **Proof available** — only items in [facts.md](facts.md). If a claim is not there, verify it in the code and
  add it, or leave it out.

## 2. Message hierarchy

1. **Headline** — the outcome for the reader, in their words, ≤ 10 words. Not the product category.
2. **Subhead** — how it works, one sentence, concrete nouns (SDK names, "no rebuild").
3. **Primary CTA** visible without scrolling at 390×844 and 1280×800.
4. **Show, don't tell** — the live demo (switching Acme ↔ Globex) is the strongest proof; put it high.
5. **How it works** — 3–4 steps, each a verb.
6. **Benefits** grouped by reader (agency vs developer), each with the feature that delivers it.
7. **Code** — the shortest real snippet that renders a theme (copy from `apps/site/src/content/docs/sdks/*`).
8. **Objections / FAQ** — hosting cost, offline behaviour, lock-in, accessibility, security of publishable keys.
9. **Closing CTA** repeating the primary action.

Starlight specifics: the landing is `template: splash` in `apps/site/src/content/docs/index.mdx`; reuse
`HowItWorks.astro`, `components/landing/*` (`Hero.astro` overrides Starlight's hero; `HeroDemo`, `BrandPlayground`,
`LayerStack` render real themes via `@debdaru07/react` and `@debdaru07/schema`), `<LinkButton>`, `<Tabs>`; URLs come from
`src/config.ts`. Landing styles live in `src/styles/landing.css`.

## 3. Copy rules

- **Never fabricate.** No invented customers, logos, testimonials, user counts, uptime or performance numbers.
  "Used by…" only with written permission from that user.
- Specific beats clever: "Publish a new brand to Flutter and React apps without a release" > "Theming,
  reimagined".
- Sentence case for headings and buttons. Buttons say what happens: *Open Theme Studio*, *Copy snippet*,
  *Read the Flutter guide* — never *Click here* / *Learn more* alone.
- Short sentences, active voice, second person ("you"). Aim for grade 8 readability.
- Banned filler: seamless, revolutionary, cutting-edge, next-generation, leverage, unlock, supercharge,
  game-changer, effortless, robust, world-class, best-in-class, "in today's fast-paced world".
- Every number is checkable in the repo (see facts.md) and stated with its unit ("44px", "1,950 fonts").
- Free-tier caveats are stated plainly where relevant (API cold start ~30–60s).

## 4. Metadata and discoverability (Starlight frontmatter / `astro.config.mjs`)

| Item | Rule |
| --- | --- |
| `title` | ≤ 60 characters, product name last ("Runtime theming for multi-tenant SaaS · Theme Studio") |
| `description` | 120–155 characters, includes the reader's problem |
| `site` in `astro.config.mjs` | Set to the deployed docs URL so canonical URLs and the sitemap are generated |
| Open Graph / Twitter | `og:title`, `og:description`, `og:image` (1200×630 PNG in `public/`), `twitter:card=summary_large_image` via Starlight `head` config |
| Structured data | `SoftwareApplication` JSON-LD on the landing page (name, description, applicationCategory, operatingSystem, url) |
| Links | Descriptive anchor text; external links open in the same tab unless leaving mid-task |

## 5. Before you ship

- [ ] Brief written; one primary CTA; above the fold on phone and desktop.
- [ ] Every claim traced to facts.md or code. No filler words from the banned list.
- [ ] Reads well at 320px; CTAs ≥ 44px; no horizontal scroll (`npm run audit:ui -- --only site`).
- [ ] Title/description lengths checked; OG image present; `site` set.
- [ ] Light and dark mode screenshots reviewed against **design-taste**'s rubric.
