# Changelog

## 0.2.0

* Live theme updates: `client.watch(options?)` holds a Server-Sent Events connection to `/v1/theme/events` while the page is visible and calls `refresh()` when a new theme is published, so open pages re-skin within about a second. It also refreshes (debounced) on `visibilitychange`, `focus` and `online`, reconnects with backoff, and falls back to the focus refresh without `EventSource`. Options: `eventSource`, `lifecycle`, `debounceMs`, `minRetryMs`, `maxRetryMs`. Returns a stop function. `load()` and `refresh()` are unchanged.
* New exports: `documentLifecycle`, `WatchOptions`, `WatchLifecycle`, `LifecycleSignal`, `EventSourceFactory`, `EventSourceLike` (also from `@debdaru07/web/core`).
* Component tuning: `componentTokens(theme)` and per-size and per-variant CSS variables (`--dts-button-lg-height`, `--dts-button-tonal-container`, …) that `components.css` reads, with fallbacks for themes published before tuning.
* Requires a Theme API with `/v1/theme/events` for live updates; against an older API, `watch()` still refreshes on focus and retries the stream with backoff.

## 0.1.1

* Documentation: package README for the registry page (install, quick start against the hosted demo API, components, links). No code changes.

## 0.1.0

* First release.
