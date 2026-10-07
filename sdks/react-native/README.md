# @debdaru07/react-native

[![npm](https://img.shields.io/npm/v/@debdaru07/react-native)](https://www.npmjs.com/package/@debdaru07/react-native) [![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Debdaru07/theme-studio/blob/main/sdks/react-native/LICENSE)

Runtime theming for React Native: a provider, hooks, themed UI components, and helpers that turn the resolved theme
into values for `StyleSheet`. Each client's published theme is fetched from the Theme Studio API and applied at
runtime, so one app carries every client's brand without a new store release.

[Docs](https://theme-studio-docs.debdarudasgupta0799.workers.dev/sdks/react-native/) · [Theme Studio](https://theme-studio.debdarudasgupta0799.workers.dev) · [GitHub](https://github.com/Debdaru07/theme-studio)

## Before you start

You need a Theme API **endpoint** and a client's **publishable key** (`pk_…`, read-only and safe to ship in an app).
Both are on the client's **Integrate** tab in Theme Studio. To try it straight away, use the hosted demo:
endpoint `https://theme-studio-api.onrender.com`, key `pk_demo_acme` or `pk_demo_globex`. The free demo API can take
up to a minute to wake up; apps keep showing their cached theme meanwhile.

## Install

```sh
npm install @debdaru07/react-native
# optional, for a persistent offline cache:
npm install @react-native-async-storage/async-storage
```

`react` (^19) and `react-native` (>=0.76) are peer dependencies. AsyncStorage isn't a dependency of this package:
pass any `{ getItem, setItem }` as `storage`.

## Quick start

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createThemeClient, ThemeProvider, Card, Button, StatusChip } from '@debdaru07/react-native';

const client = createThemeClient({
  endpoint: 'https://theme-studio-api.onrender.com',
  key: 'pk_demo_acme',
  storage: AsyncStorage, // cached theme shows instantly, even offline
});

export default function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Card title="Next booking" subtitle="Thu 14 Nov · 09:30" actions={<Button title="Reschedule" onPress={() => {}} />}>
        <StatusChip label="Confirmed" tone="success" />
      </Card>
    </ThemeProvider>
  );
}
```

## Components

Same names and props as `@debdaru07/react`, in React Native terms (`onPress`, `onChangeText`, `onValueChange`,
`visible`). Everything is styled from the theme: colors for the current mode, text styles, radii, card elevation,
disabled opacity, and the component tuning (button sizes × variants, input, card, dialog, chip and badge spacing).

| Group | Components |
| --- | --- |
| Actions | `Button` (filled, tonal, outlined, text, danger; sizes; icon; loading), `IconButton` |
| Inputs | `TextField` (hint, error, prefix/suffix, multiline), `Checkbox`, `Switch`, `Chip` (filter, input) |
| Display | `Card`, `StatCard`, `ListItem`, `Avatar`, `Badge`, `StatusChip`, `Text` |
| Feedback | `Alert`, `Toast`, `Progress`, `Skeleton`, `EmptyState` |
| Overlays | `Dialog`, `ConfirmDialog` |
| Navigation | `Tabs` |

React Native's own `Text` and `Switch` share names with two of these; alias one when you need both, e.g.
`import { Text as DtText } from '@debdaru07/react-native'`.

## Styling your own views

```tsx
import { View, Text } from 'react-native';
import { useTheme, textStyle, shadow, radius, componentTokens } from '@debdaru07/react-native';

function Panel() {
  const { theme, colors, mode, breakpoint } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius(theme, 'md'),
        padding: componentTokens(theme).card.padding,
        ...shadow(theme, componentTokens(theme).card.elevation, mode),
      }}
    >
      <Text style={[textStyle(theme, 'headline', breakpoint), { color: colors.onSurface }]}>{theme.assets.appName}</Text>
    </View>
  );
}
```

### React Navigation

```tsx
const { theme } = useTheme();
const pattern = useNavigationPattern(); // 'bottomBar' | 'rail' | 'drawer' | 'sidebar' | 'topTabs'
<Stack.Navigator screenOptions={screenAnimation(theme, { reducedMotion: useReducedMotion() })} />;
```

## Helpers

| Helper | Output |
| --- | --- |
| `textStyle(theme, name, breakpoint?, { fontFamily? })` | `{ fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontStyle }`. `display`/`headline` are scaled by `responsiveScale[breakpoint]`. Pass `fontFamily: (family, weight) => …` to map to registered font names (for example `@expo-google-fonts`) |
| `textStyles(theme, breakpoint?)` | All 10 styles |
| `shadow(theme, level, mode)` | `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }` (iOS and Android) |
| `easing(theme, name)` / `easingFunction(theme, name, Easing)` | `[x1, y1, x2, y2]` or `Easing.bezier(...)` (RN or Reanimated) |
| `screenAnimation(theme, { reducedMotion? })` | `{ animation, animationDuration }` for native-stack: fade→`fade`, slide→`slide_from_right`, scale→`fade_from_bottom`, sharedAxis→`slide_from_right`, none→`none` |
| `radius(theme, name, { cut? })` | Number. RN can't draw chamfered corners, so `cornerStyle: 'cut'` themes get `0` (sharp), except `full`. Use `{ cut: 'radius' }` for the raw value |
| `cornerRadius(theme, px)` | Same cut-corner rule for a raw px value (used for component radii) |

### Component styles

The built-in components use these, and you can too for your own pressables and surfaces. They read the theme's
component tuning (`components.button.sizes`, `.variants`, `input`, `card`, `chip`, …) through `componentTokens(theme)`,
so themes published before tuning existed get the same defaults. Colors are resolved from role names for `mode`.

| Helper | Output |
| --- | --- |
| `buttonStyles(theme, { variant?, size?, mode, disabled? })` | `{ container, label }`: size height / paddingX / text style, variant container / content / border colors and elevation shadow, border width (0 when the border is `transparent`), radius, `gap` = icon gap, `textTransform`. Defaults: the theme's variant, `md` |
| `inputStyles(theme, { variant?, mode, state? })` | `{ wrapper, field, label, text }`: label gap, height, paddingX, border width (thicker when `focused`/`error`), radius, filled vs outlined |
| `chipStyles(theme, { selected?, mode })` | `{ container, label }`: height, paddingX, icon gap, radius, selected container / content roles |
| `cardStyle(theme, mode, variant?)` | Padding, gap, radius, elevation shadow, border when outlined or `card.bordered` |
| `dialogStyles(theme, mode)` | `{ container, actions }`: padding, radius, elevation; `actions.gap` = action gap |
| `badgeStyle(theme, mode)` | Count-badge pill: paddingX, radius, error color |

```tsx
const { theme, mode } = useTheme();
const { container, label } = buttonStyles(theme, { variant: 'tonal', size: 'lg', mode });
<Pressable style={container}><Text style={label}>Continue</Text></Pressable>;
```

Hooks: `useTheme()` returns `{ theme, mode, colors, breakpoint, status, source, error, client }`.
The others are `useToken(path)`, `useBreakpoint()` (from `useWindowDimensions`), `useNavigationPattern()`,
`useMotion()` and `useReducedMotion()` (from `AccessibilityInfo`).

## Fonts

Themes name Google Fonts families. Load them in the app, for example with `expo-font` / `@expo-google-fonts/*`.
If you register fonts per weight, map the names with the `fontFamily` option of `textStyle`.

## Related packages

- [`@debdaru07/react`](https://www.npmjs.com/package/@debdaru07/react): React for the web
- [`@debdaru07/web`](https://www.npmjs.com/package/@debdaru07/web): framework-agnostic client and CSS variables
- [`theme_studio`](https://pub.dev/packages/theme_studio): Flutter

## License

MIT © Debdaru07
