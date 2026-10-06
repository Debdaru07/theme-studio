import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;

import '../models/theme.dart';
import 'cache.dart';

/// Where the current theme came from.
enum DtThemeSource { bundled, cache, network }

/// Outcome of the most recent sync with the API.
enum DtSyncStatus {
  /// Not synced yet.
  idle,

  /// A request is in flight.
  syncing,

  /// The theme matches what the API serves (200 or 304).
  upToDate,

  /// Network error, timeout or 5xx. The previous theme is kept.
  offline,

  /// 401/403: the publishable key was rejected.
  unauthorized,

  /// 404: the client has no published theme.
  notPublished,

  /// The API answered 200 but the body was not a valid theme for this SDK.
  invalid,
}

@immutable
class DtThemeState {
  const DtThemeState({
    required this.theme,
    required this.source,
    required this.status,
    this.etag,
    this.error,
    this.lastSyncedAt,
  });

  final DtTheme theme;
  final DtThemeSource source;
  final DtSyncStatus status;

  /// ETag of [theme] when it came from the cache or the network.
  final String? etag;

  /// The error behind a failed sync, if any.
  final Object? error;
  final DateTime? lastSyncedAt;

  DtThemeState copyWith({
    DtTheme? theme,
    DtThemeSource? source,
    DtSyncStatus? status,
    String? etag,
    Object? error,
    DateTime? lastSyncedAt,
  }) =>
      DtThemeState(
        theme: theme ?? this.theme,
        source: source ?? this.source,
        status: status ?? this.status,
        etag: etag ?? this.etag,
        error: error,
        lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      );

  @override
  String toString() => 'DtThemeState(${theme.meta?.client ?? 'base'} v${theme.meta?.version}, '
      'source: ${source.name}, status: ${status.name}${error == null ? '' : ', error: $error'})';
}

/// Fetches the client's published, resolved theme and keeps it fresh.
///
/// Load order: cache (instant) → network with `If-None-Match` → on change, update cache and
/// notify. On failure the cached theme is kept; with no cache the bundled default is used.
class DynamicThemeClient {
  DynamicThemeClient(
    String endpoint,
    this.publishableKey, {
    http.Client? httpClient,
    ThemeCache? cache,
    DtTheme? fallbackTheme,
    this.timeout = const Duration(seconds: 10),
  })  : endpoint = endpoint.endsWith('/') ? endpoint.substring(0, endpoint.length - 1) : endpoint,
        _http = httpClient ?? http.Client(),
        _ownsHttp = httpClient == null,
        cache = cache ?? SharedPreferencesThemeCache(),
        _fallback = fallbackTheme,
        _state = ValueNotifier(DtThemeState(
          theme: fallbackTheme ?? DtTheme.fallback,
          source: DtThemeSource.bundled,
          status: DtSyncStatus.idle,
        ));

  static const String defaultEndpoint = 'http://localhost:8787';
  static const String bundledAsset = 'packages/dynamic_theme/assets/default_theme.json';

  final String endpoint;
  final String publishableKey;
  final ThemeCache cache;
  final Duration timeout;
  final http.Client _http;
  final bool _ownsHttp;
  final DtTheme? _fallback;
  final ValueNotifier<DtThemeState> _state;
  final StreamController<DtThemeState> _changes = StreamController.broadcast();

  Future<void>? _initFuture;
  Future<void>? _cacheFuture;
  Future<DtThemeState>? _inflight;
  bool _disposed = false;

  Uri get themeUri => Uri.parse('$endpoint/v1/theme');

  /// Cache key; distinct per endpoint and key so switching clients never mixes themes.
  String get cacheKey => '$endpoint|$publishableKey';

  /// Current theme and sync status. Notifies on every change.
  ValueListenable<DtThemeState> get state => _state;

  /// Same as [state], as a broadcast stream.
  Stream<DtThemeState> get changes => _changes.stream;

  DtTheme get theme => _state.value.theme;

  /// Loads the cached theme, then syncs with the API. Safe to call more than once.
  Future<void> init() => _initFuture ??= _init();

  Future<void> _init() async {
    await loadCache();
    await refresh();
  }

  /// Applies the cached theme, if any. Called by [init]; memoized.
  Future<void> loadCache() => _cacheFuture ??= _loadCache();

  Future<void> _loadCache() async {
    CachedTheme? cached;
    try {
      cached = await cache.read(cacheKey);
    } catch (_) {
      return;
    }
    if (cached == null) return;
    try {
      _emit(_state.value.copyWith(
        theme: DtTheme.fromJsonString(cached.json),
        source: DtThemeSource.cache,
        etag: cached.etag,
      ));
    } catch (_) {
      // Unreadable or from an incompatible schema: drop it.
      await _safely(() => cache.remove(cacheKey));
    }
  }

  /// Fetches `/v1/theme`. Concurrent calls share one request.
  Future<DtThemeState> refresh() => _inflight ??= _refresh().whenComplete(() => _inflight = null);

  Future<DtThemeState> _refresh() async {
    if (_disposed) return _state.value;
    _emit(_state.value.copyWith(status: DtSyncStatus.syncing, error: _state.value.error));
    final current = _state.value;
    final etag = current.source == DtThemeSource.bundled ? null : current.etag;

    http.Response res;
    try {
      res = await _http.get(themeUri, headers: {
        'X-Theme-Key': publishableKey,
        'Accept': 'application/json',
        'If-None-Match': ?etag,
      }).timeout(timeout);
    } catch (e) {
      return _fail(DtSyncStatus.offline, e);
    }

    final now = DateTime.now();
    switch (res.statusCode) {
      case 200:
        final DtTheme theme;
        try {
          theme = DtTheme.fromJsonString(res.body);
        } catch (e) {
          return _fail(DtSyncStatus.invalid, e);
        }
        final newEtag = res.headers['etag'] ?? (theme.hash == null ? null : '"${theme.hash}"');
        await _safely(() => cache.write(cacheKey, CachedTheme(json: res.body, etag: newEtag, savedAt: now)));
        // Keep the same instance when nothing changed, so listeners can skip rebuilding.
        final same = current.source != DtThemeSource.bundled && theme.hash != null && theme.hash == current.theme.hash;
        return _emit(DtThemeState(
          theme: same ? current.theme : theme,
          source: DtThemeSource.network,
          status: DtSyncStatus.upToDate,
          etag: newEtag,
          lastSyncedAt: now,
        ));
      case 304:
        return _emit(current.copyWith(status: DtSyncStatus.upToDate, lastSyncedAt: now));
      case 401 || 403:
        return _fail(DtSyncStatus.unauthorized, DtHttpException(res));
      case 404:
        return _fail(DtSyncStatus.notPublished, DtHttpException(res));
      default:
        return _fail(DtSyncStatus.offline, DtHttpException(res));
    }
  }

  Future<DtThemeState> _fail(DtSyncStatus status, Object error) async {
    var next = _state.value.copyWith(status: status, error: error);
    if (next.source == DtThemeSource.bundled) {
      next = next.copyWith(theme: await loadBundledTheme(), status: status, error: error);
    }
    return _emit(next);
  }

  /// The last-resort theme: [fallbackTheme] if given, else `assets/default_theme.json`,
  /// else the copy compiled into the SDK.
  Future<DtTheme> loadBundledTheme() async {
    if (_fallback != null) return _fallback;
    try {
      return DtTheme.fromJsonString(await rootBundle.loadString(bundledAsset));
    } catch (_) {
      return DtTheme.fallback;
    }
  }

  /// Removes the cached theme for this client.
  Future<void> clearCache() => cache.remove(cacheKey);

  DtThemeState _emit(DtThemeState s) {
    if (_disposed) return s;
    _state.value = s;
    _changes.add(s);
    return s;
  }

  static Future<void> _safely(Future<void> Function() f) async {
    try {
      await f();
    } catch (_) {}
  }

  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _state.dispose();
    _changes.close();
    if (_ownsHttp) _http.close();
  }
}

/// A non-success HTTP status from the theme API.
class DtHttpException implements Exception {
  DtHttpException(http.Response res)
      : statusCode = res.statusCode,
        body = res.body.length > 200 ? '${res.body.substring(0, 200)}…' : res.body;

  final int statusCode;
  final String body;

  @override
  String toString() => 'HTTP $statusCode${body.isEmpty ? '' : ': $body'}';
}
