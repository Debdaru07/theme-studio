# @debdaru07/web

[![npm](https://img.shields.io/npm/v/@debdaru07/web)](https://www.npmjs.com/package/@debdaru07/web) [![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Debdaru07/theme-studio/blob/main/sdks/web/LICENSE)

Runtime theming for any web app. Fetches a client's published theme from the Theme Studio API, caches it, and applies
it as CSS custom properties (`--dts-*`), so one product can carry every client's brand without a rebuild. Also ships a
framework-agnostic component stylesheet.

[Docs](https://theme-studio-docs.debdarudasgupta0799.workers.dev/sdks/web/) · [Theme Studio](https://theme-studio.debdarudasgupta0799.workers.dev) · [GitHub](https://github.com/Debdaru07/theme-studio)

## Before you start

You need a Theme API **endpoint** and a client's **publishable key** (`pk_…`, read-only and safe to ship in an app).
Both are on the client's **Integrate** tab in Theme Studio. To try it straight away, use the hosted demo:
endpoint `https://theme-studio-api.onrender.com`, key `pk_demo_acme` or `pk_demo_globex`. The free demo API can take
up to a minute to wake up; apps keep showing their cached theme meanwhile.

## Install

```sh
npm install @debdaru07/web
```

## Quick start

```ts
import { createThemeClient, applyTheme } from '@debdaru07/web';

const client = createThemeClient({ endpoint: 'https://theme-studio-api.onrender.com', key: 'pk_demo_acme' });

let dispose = applyTheme(client.current, { mode: 'system' }); // bundled default or cached theme
client.subscribe(({ theme }) => {
  dispose();
  dispose = applyTheme(theme, { mode: 'system' });
});
await client.load(); // cache first (instant), then GET /v1/theme with If-None-Match
```

Then style with the variables:

```css
.button {
  height: var(--dts-button-height);
  padding-inline: var(--dts-button-padding-x);
  border-radius: var(--dts-button-radius);
  background: var(--dts-color-primary);
  color: var(--dts-color-on-primary);
  transition: background var(--dts-duration-short) var(--dts-easing-standard);
}
```

Type-safe references from TypeScript: `cssVar('color.onPrimaryContainer')` returns `var(--dts-color-on-primary-container)`.

## Components

Import the stylesheet once, then use plain HTML with `dts-*` classes. State lives in native and ARIA attributes
(`disabled`, `aria-invalid`, `aria-pressed`, `aria-selected`), so styling and accessibility can't drift apart.

```ts
import '@debdaru07/web/components.css';
```

```html
<button class="dts-button dts-button--filled">Save changes</button>
<span class="dts-status dts-status--success">Delivered</span>
<article class="dts-card">
  <h3 class="dts-card__title">Next booking</h3>
  <p class="dts-card__body">Two items need attention before your visit.</p>
</article>
```

Included: button, icon button, text field, checkbox, switch, chips, status chip, badge, card and stat card, list,
avatar, alert, toast, progress and spinner, skeleton, empty state, dialog, tabs, and the 10 text styles. Every value
comes from the theme. For markup, variants and a live preview of each, open **Integrate → Components** in Theme
Studio.

## Details

### Scoped previews

`applyTheme(theme, { root: element, mode: 'dark', breakpoint: 'auto' })` writes the variables and the
`data-dts-mode` / `data-dts-breakpoint` attributes on that element only. With `breakpoint: 'auto'` a
`ResizeObserver` on the element picks the layout breakpoint, so a 390px preview frame behaves like a phone.
The returned function removes everything it set.

### SSR

`themeStylesheet(theme, ':root')` returns CSS text. It has the light variables, a `[data-dts-mode="dark"]` block
and `@media (min-width)` layout blocks. Inline it in `<head>` to avoid a flash of unthemed content.

### Load lifecycle

| Situation | Result |
| --- | --- |
| Cache present | Applied immediately (`source: 'cache'`), then revalidated |
| 200 | New theme is cached with its ETag and listeners are notified (`source: 'network'`) |
| 304 | Nothing changes and `status` becomes `ready` |
| 401 / 404 / network error | Current theme kept, `status: 'error'`, `error.status` set |
| No cache, no network | Bundled platform default (`DEFAULT_THEME`) or `fallback` |

`storage` is any `{ getItem, setItem }`, sync or async. The default is a `localStorage` wrapper that never throws.
For SSR or tests, use `memoryStorage()`.
`@debdaru07/web/core` is a DOM-free entry point (client + token helpers) for non-browser runtimes.

## CSS variables

| Variable | Source |
| --- | --- |
| `--dts-color-<role>` | `color[mode]`, kebab-cased (`on-primary-container`) |
| `--dts-space-{xs…3xl}`, `--dts-radius-{none…full}`, `--dts-border-{thin,thick}` | spacing scale, shape (px) |
| `--dts-corner-style` | `rounded` or `cut` |
| `--dts-font-{primary,secondary,mono}` | font stacks with a generic fallback |
| `--dts-text-<style>-{family,size,weight,line-height,letter-spacing}` | the 10 text styles |
| `--dts-shadow-level{0…5}`, `--dts-card-shadow`, `--dts-dialog-shadow` | full `box-shadow` for the mode |
| `--dts-duration-*` (ms), `--dts-easing-*` (`cubic-bezier()`) | motion |
| `--dts-z-*`, `--dts-opacity-*`, `--dts-focus-ring-{width,offset}`, `--dts-blur-{sm,md}` | elevation and effects |
| `--dts-control-height-*`, `--dts-icon-*`, `--dts-min-touch-target`, `--dts-app-bar-height` | sizing |
| `--dts-button-{radius,height,padding-x,text-transform}`, `--dts-input-{radius,height}`, `--dts-card-{radius,padding,border}`, `--dts-dialog-{radius,padding}`, `--dts-chip-radius`, `--dts-badge-radius`, `--dts-list-gap`, `--dts-form-gap` | components |
| `--dts-page-padding`, `--dts-section-gap`, `--dts-card-gap`, `--dts-content-max-width` (`none` when unconstrained) | layout for the current breakpoint |
| `--dts-gradient-brand` | only when `effects.gradient.enabled` |

## Related packages

- [`@debdaru07/react`](https://www.npmjs.com/package/@debdaru07/react): provider, hooks and components for React
- [`@debdaru07/react-native`](https://www.npmjs.com/package/@debdaru07/react-native): React Native
- [`@debdaru07/schema`](https://www.npmjs.com/package/@debdaru07/schema): token schema, resolver and contrast checks
- [`theme_studio`](https://pub.dev/packages/theme_studio): Flutter

## License

MIT © Debdaru07
