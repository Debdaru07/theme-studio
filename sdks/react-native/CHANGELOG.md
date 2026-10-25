# Changelog

## 0.2.0

* Live theme updates: `<ThemeProvider live>` (default `false`) connects to `/v1/theme/events` while the app is in the foreground (`AppState`), disconnects in the background, and refreshes whenever the app becomes active. React Native has no built-in `EventSource`: pass one, for example `live={{ eventSource: EventSource }}` with `react-native-sse`.
* New export: `appStateLifecycle()`.
* Component tuning: `buttonStyles`, `inputStyles`, `chipStyles`, `cardStyle`, `dialogStyles` and `badgeStyle` helpers; the components use them.

## 0.1.1

* Documentation: package README for the registry page (install, quick start against the hosted demo API, components, links). No code changes.

## 0.1.0

* First release.
