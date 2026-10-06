import 'dart:convert';

import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;

/// `flutter run --dart-define=DTS_ENDPOINT=http://192.168.1.10:8787`
const String kEndpoint = String.fromEnvironment('DTS_ENDPOINT', defaultValue: DynamicThemeClient.defaultEndpoint);

enum DemoClient {
  acme('Acme', 'pk_demo_acme', 'assets/themes/acme.json'),
  globex('Globex', 'pk_demo_globex', 'assets/themes/globex.json');

  const DemoClient(this.label, this.publishableKey, this.offlineAsset);

  final String label;
  final String publishableKey;
  final String offlineAsset;
}

/// Demo state: which client, live vs. offline, and light/dark.
class DemoSettings extends ChangeNotifier {
  DemoSettings() {
    _themeClient = _createClient();
  }

  DemoClient _demo = DemoClient.acme;
  bool _offline = false;
  ThemeMode _themeMode = ThemeMode.system;
  late DynamicThemeClient _themeClient;

  DemoClient get demo => _demo;
  bool get offline => _offline;
  ThemeMode get themeMode => _themeMode;
  DynamicThemeClient get themeClient => _themeClient;

  set demo(DemoClient value) {
    if (value == _demo) return;
    _demo = value;
    _replaceClient();
  }

  set offline(bool value) {
    if (value == _offline) return;
    _offline = value;
    _replaceClient();
  }

  set themeMode(ThemeMode value) {
    _themeMode = value;
    notifyListeners();
  }

  DynamicThemeClient _createClient() => _offline
      // Offline demo: same client code path, but the "API" is served from bundled fixtures.
      ? DynamicThemeClient(
          'offline://fixtures',
          _demo.publishableKey,
          httpClient: AssetThemeHttpClient({for (final d in DemoClient.values) d.publishableKey: d.offlineAsset}),
          cache: MemoryThemeCache(),
        )
      : DynamicThemeClient(kEndpoint, _demo.publishableKey);

  void _replaceClient() {
    final old = _themeClient;
    _themeClient = _createClient();
    notifyListeners();
    // Dispose after the widget tree has switched to the new client.
    WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
  }

  @override
  void dispose() {
    _themeClient.dispose();
    super.dispose();
  }
}

/// Emulates `GET /v1/theme` (ETag + 304 + 401) from bundled JSON files.
class AssetThemeHttpClient extends http.BaseClient {
  AssetThemeHttpClient(this.assetsByKey);

  final Map<String, String> assetsByKey;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final asset = assetsByKey[request.headers['X-Theme-Key']];
    if (asset == null) return _response('{"error":"invalid publishable key"}', 401);
    final body = await rootBundle.loadString(asset);
    final hash = ((jsonDecode(body) as Map<String, dynamic>)['meta'] as Map<String, dynamic>)['hash'];
    final etag = '"$hash"';
    if (request.headers['If-None-Match'] == etag) return _response('', 304, etag: etag);
    return _response(body, 200, etag: etag);
  }

  http.StreamedResponse _response(String body, int status, {String? etag}) => http.StreamedResponse(
        Stream.value(utf8.encode(body)),
        status,
        headers: {'content-type': 'application/json', 'etag': ?etag},
      );
}
