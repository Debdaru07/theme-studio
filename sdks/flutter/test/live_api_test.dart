// Integration test against a running Theme API. Skipped unless DTS_LIVE_ENDPOINT is set:
//
//   npm run dev:server                       # repo root, seeds demo data
//   DTS_LIVE_ENDPOINT=http://localhost:8787 flutter test test/live_api_test.dart
//
// Uses plain `test` (not `testWidgets`): the widget binding replaces HttpClient with a fake.
import 'dart:io';

import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final endpoint = Platform.environment['DTS_LIVE_ENDPOINT'];
  final skip = endpoint == null ? 'set DTS_LIVE_ENDPOINT to run against a live API' : null;

  test('loads the published theme, then revalidates with a 304', () async {
    final client = DynamicThemeClient(endpoint!, 'pk_demo_globex', cache: MemoryThemeCache());
    addTearDown(client.dispose);

    await client.init();
    final first = client.state.value;
    expect(first.source, DtThemeSource.network);
    expect(first.status, DtSyncStatus.upToDate);
    expect(first.theme.meta?.client, 'globex');
    expect(first.etag, isNotNull);

    // Same ETag → 304 → the same theme instance is kept (no rebuild).
    final second = await client.refresh();
    expect(second.status, DtSyncStatus.upToDate);
    expect(identical(second.theme, first.theme), isTrue);

    // The mapped Material theme reflects the client's tokens.
    final light = DtThemeBuilder(first.theme, fonts: DtFonts.system).light;
    expect(light.colorScheme.primary.toARGB32(), 0xFF0F766E);
  }, skip: skip);

  test('reports an unknown key as unauthorized and keeps the fallback', () async {
    final client = DynamicThemeClient(endpoint!, 'pk_does_not_exist', cache: MemoryThemeCache());
    addTearDown(client.dispose);

    await client.init();
    expect(client.state.value.status, DtSyncStatus.unauthorized);
    expect(client.state.value.source, DtThemeSource.bundled);
  }, skip: skip);
}
