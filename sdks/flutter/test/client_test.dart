import 'dart:async';

import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'helpers.dart';

const endpoint = 'http://theme.test';
const key = 'pk_demo_acme';
const cacheKey = '$endpoint|$key';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late List<http.Request> requests;

  MockClient mock(FutureOr<http.Response> Function(http.Request req) handler) {
    requests = [];
    return MockClient((req) async {
      requests.add(req);
      return handler(req);
    });
  }

  http.Response ok(String name) => http.Response(
        fixtureString(name),
        200,
        headers: {'etag': '"${fixture(name).hash}"', 'content-type': 'application/json'},
      );

  DynamicThemeClient client(http.Client http, ThemeCache cache) =>
      DynamicThemeClient('$endpoint/', key, httpClient: http, cache: cache);

  test('starts with the bundled default synchronously', () {
    final c = client(mock((_) => http.Response('', 500)), MemoryThemeCache());
    expect(c.state.value.source, DtThemeSource.bundled);
    expect(c.state.value.status, DtSyncStatus.idle);
    expect(c.theme.hash, 'fixture-base-v0');
    c.dispose();
  });

  test('200 applies the theme, writes the cache and sends the key', () async {
    final cache = MemoryThemeCache();
    final c = client(mock((_) => ok('acme')), cache);
    final seen = <DtThemeState>[];
    c.state.addListener(() => seen.add(c.state.value));

    await c.init();

    expect(requests.single.url.toString(), '$endpoint/v1/theme');
    expect(requests.single.headers['X-Theme-Key'], key);
    expect(requests.single.headers.containsKey('If-None-Match'), isFalse);
    expect(c.state.value.source, DtThemeSource.network);
    expect(c.state.value.status, DtSyncStatus.upToDate);
    expect(c.state.value.etag, '"fixture-acme-v1"');
    expect(c.theme.color.light.primary.toARGB32(), 0xFF1D4ED8);
    expect(cache.entries[cacheKey]!.etag, '"fixture-acme-v1"');
    expect(DtTheme.fromJsonString(cache.entries[cacheKey]!.json).hash, 'fixture-acme-v1');
    expect(seen.map((s) => s.status), [DtSyncStatus.syncing, DtSyncStatus.upToDate]);
    c.dispose();
  });

  test('cache is applied first, then 304 keeps it', () async {
    final cache = MemoryThemeCache({
      cacheKey: CachedTheme(json: fixtureString('acme'), etag: '"fixture-acme-v1"'),
    });
    final c = client(mock((_) => http.Response('', 304)), cache);
    final sources = <DtThemeSource>[];
    c.state.addListener(() => sources.add(c.state.value.source));

    await c.init();

    expect(requests.single.headers['If-None-Match'], '"fixture-acme-v1"');
    expect(sources.first, DtThemeSource.cache);
    expect(c.state.value.source, DtThemeSource.cache);
    expect(c.state.value.status, DtSyncStatus.upToDate);
    expect(c.theme.hash, 'fixture-acme-v1');
    expect(c.state.value.lastSyncedAt, isNotNull);
    c.dispose();
  });

  test('a changed theme replaces the cached one', () async {
    final cache = MemoryThemeCache({
      cacheKey: CachedTheme(json: fixtureString('acme'), etag: '"fixture-acme-v1"'),
    });
    final c = client(mock((_) => ok('globex')), cache);
    await c.init();
    expect(c.theme.hash, 'fixture-globex-v1');
    expect(cache.entries[cacheKey]!.etag, '"fixture-globex-v1"');
    c.dispose();
  });

  test('ETag falls back to the meta hash when the header is missing', () async {
    final c = client(mock((_) => http.Response(fixtureString('acme'), 200)), MemoryThemeCache());
    await c.init();
    expect(c.state.value.etag, '"fixture-acme-v1"');
    c.dispose();
  });

  test('500 keeps the cached theme', () async {
    final cache = MemoryThemeCache({cacheKey: CachedTheme(json: fixtureString('acme'), etag: '"x"')});
    final c = client(mock((_) => http.Response('boom', 500)), cache);
    await c.init();
    expect(c.state.value.source, DtThemeSource.cache);
    expect(c.state.value.status, DtSyncStatus.offline);
    expect(c.state.value.error, isA<DtHttpException>().having((e) => e.statusCode, 'status', 500));
    expect(c.theme.hash, 'fixture-acme-v1');
    c.dispose();
  });

  test('network error with no cache falls back to the bundled default', () async {
    final c = client(mock((_) => throw http.ClientException('offline')), MemoryThemeCache());
    await c.init();
    expect(c.state.value.source, DtThemeSource.bundled);
    expect(c.state.value.status, DtSyncStatus.offline);
    expect(c.state.value.error, isA<http.ClientException>());
    expect(c.theme.hash, 'fixture-base-v0');
    c.dispose();
  });

  test('network error with a cache keeps the cache', () async {
    final cache = MemoryThemeCache({cacheKey: CachedTheme(json: fixtureString('globex'), etag: '"x"')});
    final c = client(mock((_) => throw http.ClientException('offline')), cache);
    await c.init();
    expect(c.state.value.source, DtThemeSource.cache);
    expect(c.theme.hash, 'fixture-globex-v1');
    c.dispose();
  });

  test('401 reports unauthorized and keeps the bundled default', () async {
    final c = client(mock((_) => http.Response('{"error":"invalid key"}', 401)), MemoryThemeCache());
    await c.init();
    expect(c.state.value.status, DtSyncStatus.unauthorized);
    expect(c.state.value.source, DtThemeSource.bundled);
    expect(c.theme.hash, 'fixture-base-v0');
    c.dispose();
  });

  test('404 reports notPublished', () async {
    final c = client(mock((_) => http.Response('', 404)), MemoryThemeCache());
    await c.init();
    expect(c.state.value.status, DtSyncStatus.notPublished);
    c.dispose();
  });

  test('invalid or newer-schema payloads are rejected and the cache is kept', () async {
    final newer = fixtureString('globex').replaceFirst('"schemaVersion": 1', '"schemaVersion": 2');
    final cache = MemoryThemeCache({cacheKey: CachedTheme(json: fixtureString('acme'), etag: '"x"')});
    final c = client(mock((_) => http.Response(newer, 200)), cache);
    await c.init();
    expect(c.state.value.status, DtSyncStatus.invalid);
    expect(c.state.value.error, isA<DtUnsupportedSchemaVersionException>());
    expect(c.theme.hash, 'fixture-acme-v1');
    expect(cache.entries[cacheKey]!.etag, '"x"');
    c.dispose();
  });

  test('a corrupt cache entry is discarded', () async {
    final cache = MemoryThemeCache({cacheKey: const CachedTheme(json: '{"schemaVersion":1}', etag: '"x"')});
    final c = client(mock((_) => throw http.ClientException('offline')), cache);
    await c.init();
    expect(cache.entries, isEmpty);
    expect(c.state.value.source, DtThemeSource.bundled);
    expect(requests.single.headers.containsKey('If-None-Match'), isFalse);
    c.dispose();
  });

  test('concurrent refreshes share one request; identical theme keeps its instance', () async {
    final c = client(mock((_) => ok('acme')), MemoryThemeCache());
    await c.init();
    final before = c.theme;
    await Future.wait([c.refresh(), c.refresh(), c.refresh()]);
    expect(requests, hasLength(2));
    expect(c.theme, same(before));
    c.dispose();
  });

  test('changes stream mirrors state', () async {
    final c = client(mock((_) => ok('acme')), MemoryThemeCache());
    final events = <DtSyncStatus>[];
    final sub = c.changes.listen((s) => events.add(s.status));
    await c.init();
    await Future<void>.delayed(Duration.zero);
    expect(events.last, DtSyncStatus.upToDate);
    await sub.cancel();
    c.dispose();
  });
}
