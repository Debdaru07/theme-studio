# @dts/react

React 19 bindings for the Dynamic Theming System: a `<ThemeProvider>` plus hooks, built on `@dts/web`.
This package re-exports everything from `@dts/web`.

## Install

```sh
npm install @dts/react react   # react ^19 is a peer dependency
```

## Quickstart

```tsx
import { createThemeClient, ThemeProvider, useTheme, cssVar } from '@dts/react';

const client = createThemeClient({ endpoint: 'http://localhost:8787', key: 'pk_demo_acme' });

export function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Home />
    </ThemeProvider>
  );
}

function Home() {
  const { theme, colors, breakpoint, status } = useTheme();
  return <h1 style={{ color: colors.primary, padding: cssVar('pagePadding') }}>{theme.assets.appName}</h1>;
}
```

### Admin live preview (scoped)

```tsx
<ThemeProvider theme={draftTheme} mode={mode} scope="element" className="device-frame" style={{ width: 390 }}>
  <SampleScreens />
</ThemeProvider>
```

With `scope="element"` the provider renders a wrapper `<div>` and puts the CSS variables on it, not on `<html>`.
`breakpoint` (default `'auto'`) measures that wrapper, so `useBreakpoint()` and `useNavigationPattern()` follow
the frame width. When a `theme` prop is passed, it takes precedence over `client`.

## API

| Export | Returns |
| --- | --- |
| `<ThemeProvider client? theme? fallback? mode? scope? breakpoint? loadFonts? autoLoad? className? style?>` | Context provider that applies the theme |
| `useTheme()` | `{ theme, mode, colors, breakpoint, status, source, error, client, rootElement }` |
| `useToken(path)` | Typed value, e.g. `useToken('color.primary')` or `useToken('spacing.scale.md')` |
| `useBreakpoint()` | `'mobile' \| 'tablet' \| 'desktop' \| 'wide'` (container-based when scoped) |
| `useNavigationPattern()` | `navigation.pattern[breakpoint]` |
| `useMotion()` | `{ duration, easing, easingCss, pageTransition, reduced }`; `prefers-reduced-motion` applies when `respectReducedMotion` is set |
| `usePrefersReducedMotion()` | `boolean` |
