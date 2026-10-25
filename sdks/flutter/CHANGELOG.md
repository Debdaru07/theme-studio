## 0.2.0

* Live theme updates: `DynamicThemeApp(live: true)` / `DynamicThemeBuilder(live: true)` streams `/v1/theme/events` while the app is resumed and refreshes when a new theme is published, so open apps re-skin within about a second. It disconnects when the app is paused or hidden and reconnects (with the existing refresh) on resume. Default `false`.
* `DynamicThemeClient.watch()` returns a `DtThemeWatch` (reconnects with backoff, stops for good on a revoked or rejected key; `stop()`) for custom setups.
* Component tuning: `DtButtonSize`, `DtButtonKind`, `context.dt.color(role)`, and button, chip, input, dialog and badge themes from the tokens.

## 0.1.1

* Documentation: pub.dev README with install, a quick start against the hosted demo API, the widget catalogue and links. No code changes.

## 0.1.0

* Initial SDK: schema v1 models, ThemeData + DtTokens mapping, client with ETag caching,
  DynamicThemeApp/DynamicThemeBuilder, DtAdaptiveScaffold, DtButton, page transitions.
* Themed components: DtButton (loading, danger, text), DtIconButton, DtTextField, DtCheckbox, DtSwitch, DtChip,
  DtStatusChip, DtBadge, DtCard, DtStatCard, DtListItem, DtAvatar, DtAlert, DtProgress, DtSkeleton, DtEmptyState,
  DtDialog, DtTabs, showDtToast, showDtConfirmDialog.
