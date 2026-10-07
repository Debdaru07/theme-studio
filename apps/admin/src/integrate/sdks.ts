/**
 * What the Integrate tab teaches, per SDK: install, connect (with this client's endpoint and key), and one
 * template per token category. Every API used here exists in `sdks/*`; keep them in sync with the SDK guides.
 */

export type SdkId = 'flutter' | 'web' | 'react' | 'react-native';

export interface Recipe {
  /** Token category this template demonstrates (matches the reference's categories). */
  title: string;
  lang: string;
  code: string;
}

export interface Sdk {
  id: SdkId;
  label: string;
  /** Path of the guide on the docs site. */
  guide: string;
  install: { lang: string; code: string; note: string };
  setup: (endpoint: string, key: string) => { lang: string; file: string; code: string };
  recipes: Recipe[];
}

/** Docs site, for "full guide" links. */
export const DOCS_URL: string = (
  import.meta.env.VITE_DOCS_URL ?? 'https://theme-studio-docs.debdarudasgupta0799.workers.dev'
).replace(/\/+$/, '');

export const SDKS: Sdk[] = [
  {
    id: 'flutter',
    label: 'Flutter',
    guide: '/sdks/flutter/',
    install: {
      lang: 'sh',
      note: 'Published on pub.dev as theme_studio.',
      code: 'flutter pub add theme_studio',
    },
    setup: (endpoint, key) => ({
      lang: 'dart',
      file: 'lib/main.dart',
      code: `import 'package:theme_studio/theme_studio.dart';
import 'package:flutter/material.dart';

final client = DynamicThemeClient('${endpoint}', '${key}');

void main() => runApp(DynamicThemeApp(
      client: client, // cached theme first, then GET /v1/theme with If-None-Match
      themeMode: ThemeMode.system,
      pollInterval: const Duration(minutes: 5),
      home: const HomePage(),
    ));`,
    }),
    recipes: [
      {
        title: 'Color',
        lang: 'dart',
        code: `final dt = context.dt; // every color role for the current light/dark mode

Container(
  color: dt.colors.surface,
  child: Text('Next booking', style: TextStyle(color: dt.colors.onSurface)),
);

// Pair a role with its on* role: these pairs are contrast-checked before publishing.
Chip(
  backgroundColor: dt.colors.successContainer,
  label: Text('Confirmed', style: TextStyle(color: dt.colors.onSuccessContainer)),
);

// Material widgets (FilledButton, Card, NavigationBar…) already read ThemeData.`,
      },
      {
        title: 'Typography',
        lang: 'dart',
        code: `final text = Theme.of(context).textTheme;

Text('Your week', style: text.headlineMedium);   // headline
Text('Service check', style: text.titleMedium);  // titleMedium
Text('Two items need…', style: text.bodyMedium); // bodyMedium
Text('Thu 14 Nov', style: text.labelSmall);      // caption

// Raw values when you need them:
context.dt.typography.fontFamily.primary;        // 'Roboto'`,
      },
      {
        title: 'Spacing & layout',
        lang: 'dart',
        code: `final dt = context.dt;

Padding(
  padding: EdgeInsets.all(dt.layout.pagePadding), // changes per breakpoint
  child: Column(children: [
    const Header(),
    SizedBox(height: dt.spacing.md),              // scale: xs sm md lg xl xxl xxxl
    const BookingCard(),
    SizedBox(height: dt.layout.sectionGap),
  ]),
);

dt.breakpoint;                                    // mobile | tablet | desktop | wide`,
      },
      {
        title: 'Shape & elevation',
        lang: 'dart',
        code: `final dt = context.dt;

Container(
  padding: EdgeInsets.all(dt.componentSpacing.cardPadding),
  decoration: BoxDecoration(
    color: dt.colors.surface,
    borderRadius: BorderRadius.circular(dt.components.card.radius),
    boxShadow: dt.shadow(dt.components.card.elevation), // levels 0–5
  ),
);

BorderRadius.circular(dt.shape.radius.md);        // none xs sm md lg xl full`,
      },
      {
        title: 'Motion',
        lang: 'dart',
        code: `final dt = context.dt;

AnimatedContainer(
  // Zero when the OS asks for reduced motion and the theme respects it.
  duration: dt.animationDuration(dt.motion.duration.medium),
  curve: dt.motion.easing.standard,
  color: selected ? dt.colors.primaryContainer : dt.colors.surface,
);

// Page transitions come from motion.pageTransition via ThemeData automatically.`,
      },
      {
        title: 'Navigation',
        lang: 'dart',
        code: `Widget build(BuildContext context) {
  return switch (context.dt.navPattern) { // pattern for the current breakpoint
    DtNavPattern.bottomBar => Scaffold(body: page, bottomNavigationBar: NavigationBar(destinations: items)),
    DtNavPattern.rail => Row(children: [NavigationRail(destinations: rails, selectedIndex: i), Expanded(child: page)]),
    _ => Scaffold(drawer: const AppDrawer(), body: page),
  };
}`,
      },
    ],
  },
  {
    id: 'web',
    label: 'Web (CSS)',
    guide: '/sdks/web/',
    install: {
      lang: 'sh',
      note: 'Published on npm as @debdaru07/web: compiled ES modules with type definitions.',
      code: 'npm install @debdaru07/web',
    },
    setup: (endpoint, key) => ({
      lang: 'ts',
      file: 'src/theme.ts',
      code: `import { createThemeClient, applyTheme } from '@debdaru07/web';

const client = createThemeClient({ endpoint: '${endpoint}', key: '${key}' });

// Writes --dts-* variables on <html>, plus data-dts-mode and data-dts-breakpoint.
let dispose = applyTheme(client.current, { mode: 'system' }); // cached theme or bundled default
client.subscribe(({ theme }) => {
  dispose();
  dispose = applyTheme(theme, { mode: 'system' });
});
await client.load(); // cache first, then GET /v1/theme with If-None-Match`,
    }),
    recipes: [
      {
        title: 'Color',
        lang: 'css',
        code: `.card {
  background: var(--dts-color-surface);
  color: var(--dts-color-on-surface);
  border: var(--dts-border-thin) solid var(--dts-color-outline-muted);
}
/* Pair a role with its on-* role: these pairs are contrast-checked before publishing. */
.button-primary {
  background: var(--dts-color-primary);
  color: var(--dts-color-on-primary);
}
.badge-success {
  background: var(--dts-color-success-container);
  color: var(--dts-color-on-success-container);
}
:focus-visible {
  outline: var(--dts-focus-ring-width) solid var(--dts-color-focus-ring);
  outline-offset: var(--dts-focus-ring-offset);
}`,
      },
      {
        title: 'Typography',
        lang: 'css',
        code: `/* Each text style has -family -size -weight -line-height -letter-spacing -font-style. */
h1 {
  font-family: var(--dts-text-headline-family);
  font-size: var(--dts-text-headline-size);
  font-weight: var(--dts-text-headline-weight);
  line-height: var(--dts-text-headline-line-height);
  letter-spacing: var(--dts-text-headline-letter-spacing);
}
body {
  font: var(--dts-text-body-medium-font-style) var(--dts-text-body-medium-weight)
    var(--dts-text-body-medium-size) / var(--dts-text-body-medium-line-height)
    var(--dts-text-body-medium-family);
}
code {
  font-family: var(--dts-font-mono);
}`,
      },
      {
        title: 'Spacing & layout',
        lang: 'css',
        code: `.page {
  padding: var(--dts-page-padding);        /* changes per breakpoint */
  max-width: var(--dts-content-max-width);
  margin-inline: auto;
}
.stack {
  display: grid;
  gap: var(--dts-space-md);                 /* xs sm md lg xl 2xl 3xl */
}
.section + .section {
  margin-top: var(--dts-section-gap);
}
.form {
  display: grid;
  gap: var(--dts-form-gap);
}`,
      },
      {
        title: 'Shape & elevation',
        lang: 'css',
        code: `.card {
  padding: var(--dts-card-padding);
  border-radius: var(--dts-card-radius);
  box-shadow: var(--dts-card-shadow);
  border: var(--dts-card-border);
}
.button {
  height: var(--dts-button-height);
  padding-inline: var(--dts-button-padding-x);
  border-radius: var(--dts-button-radius);
  text-transform: var(--dts-button-text-transform);
}
.menu {
  border-radius: var(--dts-radius-md);       /* none xs sm md lg xl full */
  box-shadow: var(--dts-shadow-level2);      /* level0 … level5 */
  z-index: var(--dts-z-dropdown);
}`,
      },
      {
        title: 'Motion',
        lang: 'css',
        code: `.button {
  transition: background-color var(--dts-duration-short) var(--dts-easing-standard);
}
.sheet {
  transition: transform var(--dts-duration-medium) var(--dts-easing-emphasized);
}
@media (prefers-reduced-motion: reduce) {
  .sheet {
    transition: none;
  }
}`,
      },
      {
        title: 'Navigation',
        lang: 'ts',
        code: `// Patterns are not CSS values: read them for the breakpoint applyTheme reports.
applyTheme(theme, {
  mode: 'system',
  onChange: ({ breakpoint }) => {
    const pattern = theme.navigation.pattern[breakpoint]; // bottomBar | rail | drawer | sidebar | topTabs
    document.body.dataset.nav = pattern;
  },
});

/* CSS: [data-dts-breakpoint='mobile'] .sidebar { display: none; } */`,
      },
    ],
  },
  {
    id: 'react',
    label: 'React',
    guide: '/sdks/react/',
    install: {
      lang: 'sh',
      note: 'Published on npm as @debdaru07/react. React 19 is a peer dependency.',
      code: 'npm install @debdaru07/react react',
    },
    setup: (endpoint, key) => ({
      lang: 'tsx',
      file: 'src/App.tsx',
      code: `import { createThemeClient, ThemeProvider } from '@debdaru07/react';

const client = createThemeClient({ endpoint: '${endpoint}', key: '${key}' });

export function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Routes />
    </ThemeProvider>
  );
}`,
    }),
    recipes: [
      {
        title: 'Color',
        lang: 'tsx',
        code: `import { cssVar, useTheme } from '@debdaru07/react';

// CSS variables re-theme without a re-render; prefer them for styling.
const card = {
  background: cssVar('color.surface'),
  color: cssVar('color.onSurface'),
};

// Hex values for the current mode, for canvas, SVG or charts.
function StatusDot() {
  const { colors } = useTheme();
  return <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill={colors.success} /></svg>;
}`,
      },
      {
        title: 'Typography',
        lang: 'tsx',
        code: `import { cssVar } from '@debdaru07/react';

const headline = {
  fontFamily: cssVar('text.headline.family'),
  fontSize: cssVar('text.headline.size'),
  fontWeight: cssVar('text.headline.weight'),
  lineHeight: cssVar('text.headline.lineHeight'),
  letterSpacing: cssVar('text.headline.letterSpacing'),
};

<h1 style={headline}>Your week</h1>;`,
      },
      {
        title: 'Spacing & layout',
        lang: 'tsx',
        code: `import { cssVar, useBreakpoint, useToken } from '@debdaru07/react';

function Page({ children }) {
  return (
    <main style={{ padding: cssVar('pagePadding'), maxWidth: cssVar('contentMaxWidth'), marginInline: 'auto' }}>
      <div style={{ display: 'grid', gap: cssVar('space.md') }}>{children}</div>
    </main>
  );
}

const gap = useToken('spacing.scale.md'); // number (px), typed
const breakpoint = useBreakpoint();        // mobile | tablet | desktop | wide`,
      },
      {
        title: 'Shape & elevation',
        lang: 'tsx',
        code: `import { cssVar } from '@debdaru07/react';

const card = {
  padding: cssVar('card.padding'),
  borderRadius: cssVar('card.radius'),
  boxShadow: cssVar('card.shadow'),
  border: cssVar('card.border'),
};
const button = {
  height: cssVar('button.height'),
  paddingInline: cssVar('button.paddingX'),
  borderRadius: cssVar('button.radius'),
};`,
      },
      {
        title: 'Motion',
        lang: 'tsx',
        code: `import { useMotion } from '@debdaru07/react';

function Fade({ show, children }) {
  // Durations are 0 when the user prefers reduced motion and the theme respects it.
  const { duration, easingCss } = useMotion();
  return (
    <div style={{ opacity: show ? 1 : 0, transition: \`opacity \${duration.medium}ms \${easingCss.standard}\` }}>
      {children}
    </div>
  );
}`,
      },
      {
        title: 'Navigation',
        lang: 'tsx',
        code: `import { useNavigationPattern } from '@debdaru07/react';

function AppShell({ children }) {
  const pattern = useNavigationPattern(); // for the current breakpoint
  if (pattern === 'bottomBar') return <><main>{children}</main><BottomBar /></>;
  if (pattern === 'topTabs') return <><TopTabs /><main>{children}</main></>;
  return <SidebarLayout variant={pattern}>{children}</SidebarLayout>;
}`,
      },
    ],
  },
  {
    id: 'react-native',
    label: 'React Native',
    guide: '/sdks/react-native/',
    install: {
      lang: 'sh',
      note: 'Published on npm as @debdaru07/react-native. AsyncStorage is optional but gives an offline cache.',
      code: `npm install @debdaru07/react-native
npm install @react-native-async-storage/async-storage`,
    },
    setup: (endpoint, key) => ({
      lang: 'tsx',
      file: 'App.tsx',
      code: `import AsyncStorage from '@react-native-async-storage/async-storage';
import { createThemeClient, ThemeProvider } from '@debdaru07/react-native';

const client = createThemeClient({ endpoint: '${endpoint}', key: '${key}', storage: AsyncStorage });

export default function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Navigation />
    </ThemeProvider>
  );
}`,
    }),
    recipes: [
      {
        title: 'Color',
        lang: 'tsx',
        code: `import { Text, View } from 'react-native';
import { useTheme } from '@debdaru07/react-native';

function Badge() {
  const { colors } = useTheme(); // hex values for the current mode
  // Pair a role with its on* role: these pairs are contrast-checked before publishing.
  return (
    <View style={{ backgroundColor: colors.successContainer }}>
      <Text style={{ color: colors.onSuccessContainer }}>Confirmed</Text>
    </View>
  );
}`,
      },
      {
        title: 'Typography',
        lang: 'tsx',
        code: `import { Text } from 'react-native';
import { textStyle, useTheme } from '@debdaru07/react-native';

function Title() {
  const { theme, colors, breakpoint } = useTheme();
  // fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontStyle
  return <Text style={[textStyle(theme, 'headline', breakpoint), { color: colors.onSurface }]}>Your week</Text>;
}`,
      },
      {
        title: 'Spacing & layout',
        lang: 'tsx',
        code: `import { ScrollView } from 'react-native';
import { useTheme } from '@debdaru07/react-native';

function Screen({ children }) {
  const { theme, breakpoint } = useTheme();
  const layout = theme.spacing.layout[breakpoint]; // pagePadding, sectionGap, cardGap
  return (
    <ScrollView contentContainerStyle={{ padding: layout.pagePadding, gap: theme.spacing.scale.md }}>
      {children}
    </ScrollView>
  );
}`,
      },
      {
        title: 'Shape & elevation',
        lang: 'tsx',
        code: `import { View } from 'react-native';
import { radius, shadow, useTheme } from '@debdaru07/react-native';

function Card({ children }) {
  const { theme, colors, mode } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius(theme, 'md'), // honours cornerStyle
        padding: theme.spacing.component.cardPadding,
        ...shadow(theme, theme.components.card.elevation, mode), // iOS + Android
      }}
    >
      {children}
    </View>
  );
}`,
      },
      {
        title: 'Motion',
        lang: 'tsx',
        code: `import { Animated, Easing } from 'react-native';
import { easingFunction, useMotion, useTheme } from '@debdaru07/react-native';

function useFadeIn(value: Animated.Value) {
  const { theme } = useTheme();
  const { duration } = useMotion(); // 0 when reduced motion is on and respected
  return () =>
    Animated.timing(value, {
      toValue: 1,
      duration: duration.medium,
      easing: easingFunction(theme, 'standard', Easing),
      useNativeDriver: true,
    }).start();
}`,
      },
      {
        title: 'Navigation',
        lang: 'tsx',
        code: `import { useNavigationPattern } from '@debdaru07/react-native';

function RootNavigator() {
  const pattern = useNavigationPattern(); // bottomBar | rail | drawer | sidebar | topTabs
  return pattern === 'drawer' ? <DrawerNavigator /> : <TabNavigator />;
}`,
      },
    ],
  },
];
