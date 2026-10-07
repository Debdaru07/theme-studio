# theme_studio

[![pub package](https://img.shields.io/pub/v/theme_studio.svg)](https://pub.dev/packages/theme_studio) [![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Debdaru07/theme-studio/blob/main/sdks/flutter/LICENSE)

Runtime, multi-tenant theming for Flutter. Fetches a client's published theme from the Theme Studio API and applies
it natively: Material 3 `ThemeData` (light and dark), a `ThemeExtension` with every token Material has no slot for,
page transitions, an adaptive navigation scaffold and themed widgets. One app can carry every client's brand, and a
new brand reaches users without a store release.

[Docs](https://theme-studio-docs.debdarudasgupta0799.workers.dev/sdks/flutter/) · [Theme Studio](https://theme-studio.debdarudasgupta0799.workers.dev) · [GitHub](https://github.com/Debdaru07/theme-studio)

## Before you start

You need a Theme API **endpoint** and a client's **publishable key** (`pk_…`, read-only and safe to ship in an app).
Both are on the client's **Integrate** tab in Theme Studio. To try it straight away, use the hosted demo:
endpoint `https://theme-studio-api.onrender.com`, key `pk_demo_acme` or `pk_demo_globex`. The free demo API can take
up to a minute to wake up; the app shows its cached (or bundled default) theme meanwhile.

## Install

```sh
flutter pub add theme_studio
```

## Quick start

```dart
import 'package:flutter/material.dart';
import 'package:theme_studio/theme_studio.dart';

final client = DynamicThemeClient('https://theme-studio-api.onrender.com', 'pk_demo_acme');

void main() => runApp(DynamicThemeApp(
      client: client, // cache first, then GET /v1/theme with If-None-Match
      themeMode: ThemeMode.system,
      pollInterval: const Duration(minutes: 5),
      home: const HomePage(),
    ));

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final dt = context.dt; // tokens for the current mode and breakpoint
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(dt.layout.pagePadding),
        child: DtCard(
          title: 'Next booking',
          subtitle: 'Thu 14 Nov · 09:30',
          actions: [DtButton(label: 'Reschedule', onPressed: () {})],
          child: const DtStatusChip(label: 'Confirmed', tone: DtTone.success),
        ),
      ),
    );
  }
}
```

Material widgets (`FilledButton`, `Card`, `NavigationBar`, `TextField`…) pick up the theme through `ThemeData`
automatically. Text styles map to `Theme.of(context).textTheme` (`headline` → `headlineMedium`, `caption` →
`labelSmall`, the rest by name).

## Widgets

| Group | Widgets |
| --- | --- |
| Actions | `DtButton` (theme variant, `danger`, `text`, `loading`), `DtIconButton` |
| Inputs | `DtTextField` (label, hint, error, prefix/suffix), `DtCheckbox`, `DtSwitch`, `DtChip` (filter, input) |
| Display | `DtCard` (elevated, outlined, filled), `DtStatCard`, `DtListItem`, `DtAvatar`, `DtBadge`, `DtStatusChip` |
| Feedback | `DtAlert`, `showDtToast`, `DtProgress`, `DtSkeleton`, `DtEmptyState` |
| Overlays | `DtDialog`, `showDtConfirmDialog` (resolves `true`/`false`) |
| Navigation | `DtTabs`, `DtAdaptiveScaffold` |

Every widget takes its colors, shapes and text from the theme; loaders and progress use theme colors, never
Material's defaults. Props and a live preview of each are on **Integrate → Components** in Theme Studio.

## API

| API | Purpose |
| --- | --- |
| `DynamicThemeClient(endpoint, key, {httpClient, cache, fallbackTheme})` | Loads cache → network (`ETag`/`304`) → bundled default. Exposes `state` (`ValueListenable<DtThemeState>`), `changes` (stream), `init()`, `refresh()`. |
| `DynamicTheme.init(publishableKey:, endpoint:)` | Creates a client and waits until the cached theme is loaded. |
| `DynamicThemeApp` / `DynamicThemeBuilder` | Rebuild with light and dark `ThemeData` when the theme changes. Refresh on app resume, with an optional poll. Typography follows the window's breakpoint. |
| `DtThemeBuilder(theme, {breakpoint, fonts})` | Maps a `DtTheme` to `ThemeData` directly (`.light`, `.dark`, `.build(brightness)`). |
| `context.dt` | Tokens and the current breakpoint: `context.dt.spacing.md`, `.colors.success`, `.layout.pagePadding`, `.breakpoint`, `.navPattern`, `.shadow(2)`, `.motion`, `.reduceMotion`. |
| `DtAdaptiveScaffold` | Bottom bar, rail, modal drawer, sidebar or top tabs, following `navigation.pattern[breakpoint]`. |
| `DtPageTransitionsBuilder` | fade, slide, scale, sharedAxis or none, using the theme's motion tokens. Honours reduced motion. |
| `ThemeCache` | `SharedPreferencesThemeCache` (default) or `MemoryThemeCache`. |

`DtTheme.fromJson` throws `DtUnsupportedSchemaVersionException` when `schemaVersion` is newer than 1, and
`DtThemeFormatException` (with a JSON path) for malformed input.

## Fonts

Fonts load through `google_fonts`. A family that isn't in its catalog falls back to a plain `fontFamily`. To turn off
fetching (for tests, or for apps that bundle fonts), set `DtFonts.resolver = DtFonts.system` or pass `fonts:` to
`DynamicThemeApp` / `DtThemeBuilder`.

## Example

The [example app](https://github.com/Debdaru07/theme-studio/tree/main/sdks/flutter/example) shows the Acme and Globex
demo clients across dashboard, orders, form and component pages, with an offline mode that serves bundled fixtures
through the same client code path.

> **Windows note:** if your Flutter SDK path contains a space (for example `C:\Flutter SDK`), `flutter test` and
> `flutter build` can fail in the `objective_c` native-assets build hook (pulled in via `path_provider` /
> `google_fonts`). Install Flutter at a path without spaces, or call it through its short 8.3 path.

## License

MIT © Debdaru07
