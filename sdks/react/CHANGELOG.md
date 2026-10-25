# Changelog

## 0.2.0

* Live theme updates: `<ThemeProvider live>` (default `false`) calls `client.watch()` on mount and stops it on unmount. Open apps re-skin within about a second of a publish while the tab is visible, and re-check on focus. Pass watch options instead of `true` if needed.
* Components pick up component tuning through `components.css` from `@debdaru07/web` 0.2.0.

## 0.1.1

* Documentation: package README for the registry page (install, quick start against the hosted demo API, components, links). No code changes.

## 0.1.0

* First release.
