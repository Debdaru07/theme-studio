# @debdaru07/react-native

React Native bindings for the Dynamic Theming System: a provider, hooks, and pure helpers that turn the resolved
theme into values you can pass to `StyleSheet`. It reuses the DOM-free theme client from `@debdaru07/web/core`.

## Install

```sh
npm install @debdaru07/react-native
# optional, for a persistent cache:
npm install @react-native-async-storage/async-storage
```

`react` (^19) and `react-native` (>=0.76) are peer dependencies. AsyncStorage is not a dependency of this
package: pass any `{ getItem, setItem }`.

## Quickstart

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Easing, StyleSheet, Text, View } from 'react-native';
import { createThemeClient, ThemeProvider, useTheme, textStyle, shadow, radius } from '@debdaru07/react-native';

// AsyncStorage already has the { getItem, setItem } shape the client needs.
const client = createThemeClient({ endpoint: 'https://themes.example.com', key: 'pk_demo_acme', storage: AsyncStorage });

export default function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Card />
    </ThemeProvider>
  );
}

function Card() {
  const { theme, colors, mode, breakpoint } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius(theme, 'md'),
        padding: theme.spacing.component.cardPadding,
        ...shadow(theme, theme.components.card.elevation, mode),
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
| `textStyle(theme, name, breakpoint?, { fontFamily? })` | `{ fontFamily, fontSize, fontWeight: '600', lineHeight, letterSpacing }`. `display`/`headline` are scaled by `responsiveScale[breakpoint]`. Pass `fontFamily: (family, weight) => …` to map to registered font names (for example `@expo-google-fonts`) |
| `textStyles(theme, breakpoint?)` | All 10 styles |
| `shadow(theme, level, mode)` | `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }` (iOS and Android) |
| `easing(theme, name)` / `easingFunction(theme, name, Easing)` | `[x1, y1, x2, y2]` or `Easing.bezier(...)` (RN or Reanimated) |
| `screenAnimation(theme, { reducedMotion? })` | `{ animation, animationDuration }` for native-stack: fade→`fade`, slide→`slide_from_right`, scale→`fade_from_bottom`, sharedAxis→`slide_from_right`, none→`none` |
| `radius(theme, name, { cut? })` | Number. RN cannot draw chamfered corners, so `cornerStyle: 'cut'` themes get `0` (sharp), except `full`. Use `{ cut: 'radius' }` to get the raw value |

Hooks: `useTheme()` returns `{ theme, mode, colors, breakpoint, status, source, error, client }`.
The others are `useToken(path)`, `useBreakpoint()` (from `useWindowDimensions`), `useNavigationPattern()`,
`useMotion()` and `useReducedMotion()` (from `AccessibilityInfo`).

## Fonts

Themes name Google Fonts families. Load them in the app, for example with `expo-font` / `@expo-google-fonts/*`.
If you register fonts per weight, map the names with the `fontFamily` option of `textStyle`.
