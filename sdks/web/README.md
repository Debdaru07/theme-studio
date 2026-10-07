# @debdaru07/web

Framework-agnostic web SDK: fetches the client's published theme, caches it, and applies it as CSS custom properties.
The server sends a fully resolved theme, so this package only maps values. It does not merge layers or derive colors.

## Install

```sh
npm install @debdaru07/web   # inside this monorepo it is already a workspace package
```

## Quickstart

```ts
import { createThemeClient, applyTheme } from '@debdaru07/web';

const client = createThemeClient({ endpoint: 'http://localhost:8787', key: 'pk_demo_acme' });

let dispose = applyTheme(client.current, { mode: 'system' }); // bundled default or cached theme
client.subscribe(({ theme }) => {
  dispose();
  dispose = applyTheme(theme, { mode: 'system' });
});
await client.load(); // cache (instant), then GET /v1/theme with If-None-Match
```

```css
.button {
  height: var(--dts-button-height);
  padding-inline: var(--dts-button-padding-x);
  border-radius: var(--dts-button-radius);
  background: var(--dts-color-primary);
  color: var(--dts-color-on-primary);
  font: var(--dts-text-label-large-weight) var(--dts-text-label-large-size) / var(--dts-text-label-large-line-height)
    var(--dts-text-label-large-family);
  transition: background var(--dts-duration-short) var(--dts-easing-standard);
}
```

Type-safe references from TS: `cssVar('color.onPrimaryContainer')` returns `var(--dts-color-on-primary-container)`.

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
