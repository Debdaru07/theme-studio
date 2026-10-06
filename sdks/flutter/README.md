# dynamic_theme

Flutter SDK for the Dynamic Theming System. It fetches a client's **fully resolved, published theme**
at runtime and applies it natively: Material 3 `ThemeData` (light and dark), a `ThemeExtension<DtTokens>`
for the tokens Material has no slot for, page transitions, and an adaptive navigation scaffold.

The server resolves themes. This SDK does not merge layers or derive colors. It only parses and maps.

## Install

The package is not on pub.dev yet, so depend on it by path or git:

```yaml
dependencies:
  dynamic_theme:
    path: ../sdks/flutter   # or a git: reference to this repo
```

## Quickstart

```dart
import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';

final client = DynamicThemeClient('http://localhost:8787', 'pk_demo_acme');

void main() => runApp(DynamicThemeApp(
      client: client,                 // cache first, then GET /v1/theme with If-None-Match
      pollInterval: const Duration(minutes: 5),
      home: Builder(builder: (context) => Padding(
        padding: EdgeInsets.all(context.dt.layout.pagePadding),
        child: DtButton(label: 'Hello', onPressed: () {}),
      )),
    ));
```

## What you get

| API | Purpose |
| --- | --- |
| `DynamicThemeClient(endpoint, key, {httpClient, cache, fallbackTheme})` | Loads cache → network (`ETag`/`304`) → bundled default. Exposes `state` (`ValueListenable<DtThemeState>`), `changes` (stream), `init()`, `refresh()`. |
| `DynamicTheme.init(publishableKey:, endpoint:)` | Creates a client and waits until the cached theme is loaded. |
| `DynamicThemeApp` / `DynamicThemeBuilder` | Rebuild with light and dark `ThemeData` when the theme changes. Refresh on app resume, with an optional poll. Typography follows the window's breakpoint. |
| `DtThemeBuilder(theme, {breakpoint, fonts})` | Maps a `DtTheme` to `ThemeData` directly (`.light`, `.dark`, `.build(brightness)`). |
| `context.dt` | Tokens and the current breakpoint: `context.dt.spacing.md`, `.colors.success`, `.layout.pagePadding`, `.breakpoint`, `.navPattern`, `.shadow(2)`, `.motion`, `.reduceMotion`. |
| `DtAdaptiveScaffold` | Bottom bar, rail, modal drawer, sidebar or top tabs, following `navigation.pattern[breakpoint]`. |
| `DtButton` | Uses the theme's button variant (filled, tonal or outlined) and applies `textTransform`. |
| `DtPageTransitionsBuilder` | fade, slide, scale, sharedAxis or none, using the theme's motion tokens. Honours reduced motion. |
| `ThemeCache` | `SharedPreferencesThemeCache` (default) or `MemoryThemeCache`. |

`DtTheme.fromJson` throws `DtUnsupportedSchemaVersionException` when `schemaVersion` is newer than 1,
and `DtThemeFormatException` (with a JSON path) for malformed input.

## Fonts

Fonts load through `google_fonts`. A family that is not in its catalog falls back to a plain `fontFamily`.
To turn off fetching (for tests, or for apps that bundle fonts), set `DtFonts.resolver = DtFonts.system`
or pass `fonts:` to `DynamicThemeApp`/`DtThemeBuilder`.

## Development

```sh
dart tool/sync_fixtures.dart   # copy packages/schema/fixtures → test/fixtures, example assets, bundled default
flutter test
flutter analyze
cd example && flutter run -d chrome --dart-define=DTS_ENDPOINT=http://localhost:8787
```

The example has an **offline demo** (the cloud icon). It serves the bundled Acme and Globex fixtures through the
same client code path, so it works without the API.

> **Windows note:** if the Flutter SDK path contains a space (for example `C:\Flutter SDK`), `flutter test`
> and `flutter build` fail in the `objective_c` native-assets build hook, which comes in via
> `path_provider`/`google_fonts`. Install Flutter at a path without spaces, or run it through a directory
> junction that has none.
