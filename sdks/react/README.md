# @debdaru07/react

[![npm](https://img.shields.io/npm/v/@debdaru07/react)](https://www.npmjs.com/package/@debdaru07/react) [![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Debdaru07/theme-studio/blob/main/sdks/react/LICENSE)

Runtime theming for React 19: a `<ThemeProvider>`, hooks and themed UI components. Each client's published theme is
fetched from the Theme Studio API and applied at runtime, so one product carries every client's brand without a
rebuild. Re-exports everything from [`@debdaru07/web`](https://www.npmjs.com/package/@debdaru07/web), so one import is
enough.

[Docs](https://theme-studio-docs.debdarudasgupta0799.workers.dev/sdks/react/) · [Theme Studio](https://theme-studio.debdarudasgupta0799.workers.dev) · [GitHub](https://github.com/Debdaru07/theme-studio)

## Before you start

You need a Theme API **endpoint** and a client's **publishable key** (`pk_…`, read-only and safe to ship in an app).
Both are on the client's **Integrate** tab in Theme Studio. To try it straight away, use the hosted demo:
endpoint `https://theme-studio-api.onrender.com`, key `pk_demo_acme` or `pk_demo_globex`. The free demo API can take
up to a minute to wake up; apps keep showing their cached theme meanwhile.

## Install

```sh
npm install @debdaru07/react react   # React ^19 is a peer dependency
```

## Quick start

```tsx
import { createThemeClient, ThemeProvider, useTheme, cssVar } from '@debdaru07/react';

const client = createThemeClient({ endpoint: 'https://theme-studio-api.onrender.com', key: 'pk_demo_acme' });

export function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Home />
    </ThemeProvider>
  );
}

function Home() {
  const { theme, colors } = useTheme();
  return <h1 style={{ color: colors.primary, padding: cssVar('pagePadding') }}>{theme.assets.appName}</h1>;
}
```

## Components

Import the stylesheet once; components take their defaults (button and input variants) from the theme.

```tsx
import '@debdaru07/react/components.css';
import { Button, Card, StatusChip, TextField, ConfirmDialog } from '@debdaru07/react';

<Card title="Next booking" subtitle="Thu 14 Nov · 09:30" actions={<Button onClick={reschedule}>Reschedule</Button>}>
  <StatusChip tone="success">Confirmed</StatusChip>
</Card>

<TextField label="Email" type="email" error={emailError} hint="We send delivery updates here" />

<ConfirmDialog open={confirming} title="Delete client?" confirmLabel="Delete" destructive
  onConfirm={remove} onCancel={() => setConfirming(false)} />
```

| Group | Components |
| --- | --- |
| Actions | `Button` (filled, tonal, outlined, text, danger; sizes; icon; loading), `IconButton` |
| Inputs | `TextField` (hint, error, prefix/suffix, multiline), `Checkbox`, `Switch`, `Chip` (filter, input) |
| Display | `Card`, `StatCard`, `List` + `ListItem`, `Avatar`, `Badge`, `StatusChip`, `Text` |
| Feedback | `Alert`, `Toast`, `Progress`, `Spinner`, `Skeleton`, `EmptyState` |
| Overlays | `Dialog`, `ConfirmDialog` (focus trap, Escape, focus restore) |
| Navigation | `Tabs` (ARIA tabs with arrow-key navigation) |

Every component reads only theme tokens and meets WCAG 2.2 AA behaviour (labels, focus, keyboard, live regions).
Props, variants and a live preview of each are on **Integrate → Components** in Theme Studio.

## Scoped themes

```tsx
<ThemeProvider theme={draftTheme} mode={mode} scope="element" className="device-frame" style={{ width: 390 }}>
  <SampleScreens />
</ThemeProvider>
```

With `scope="element"` the provider renders a wrapper `<div>` and puts the CSS variables on it instead of `<html>`.
`breakpoint` (default `'auto'`) measures that wrapper, so `useBreakpoint()` and `useNavigationPattern()` follow
its width. A `theme` prop takes precedence over `client`. Several scoped providers can coexist on one page.

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

## Related packages

- [`@debdaru07/web`](https://www.npmjs.com/package/@debdaru07/web): framework-agnostic client, CSS variables and component CSS
- [`@debdaru07/react-native`](https://www.npmjs.com/package/@debdaru07/react-native): React Native
- [`theme_studio`](https://pub.dev/packages/theme_studio): Flutter

## License

MIT © Debdaru07
