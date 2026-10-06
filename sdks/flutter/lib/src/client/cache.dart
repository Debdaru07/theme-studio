import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// A theme as last received from the API.
class CachedTheme {
  const CachedTheme({required this.json, this.etag, this.savedAt});

  /// The raw theme JSON exactly as served.
  final String json;

  /// The `ETag` response header, quotes included, sent back as `If-None-Match`.
  final String? etag;
  final DateTime? savedAt;
}

/// Persistent storage for the last good theme, keyed per endpoint + publishable key.
abstract class ThemeCache {
  Future<CachedTheme?> read(String key);
  Future<void> write(String key, CachedTheme entry);
  Future<void> remove(String key);
}

/// In-memory cache, for tests and for apps that do not want persistence.
class MemoryThemeCache implements ThemeCache {
  MemoryThemeCache([Map<String, CachedTheme>? initial]) : entries = {...?initial};

  final Map<String, CachedTheme> entries;

  @override
  Future<CachedTheme?> read(String key) async => entries[key];

  @override
  Future<void> write(String key, CachedTheme entry) async => entries[key] = entry;

  @override
  Future<void> remove(String key) async => entries.remove(key);
}

/// Stores the theme in `shared_preferences` as a single string per key.
class SharedPreferencesThemeCache implements ThemeCache {
  SharedPreferencesThemeCache({Future<SharedPreferences>? preferences, this.prefix = 'dynamic_theme.'})
      : _prefs = preferences;

  final String prefix;
  Future<SharedPreferences>? _prefs;

  Future<SharedPreferences> get _instance => _prefs ??= SharedPreferences.getInstance();

  @override
  Future<CachedTheme?> read(String key) async {
    final raw = (await _instance).getString('$prefix$key');
    if (raw == null) return null;
    try {
      final m = jsonDecode(raw) as Map<String, dynamic>;
      return CachedTheme(
        json: m['theme'] as String,
        etag: m['etag'] as String?,
        savedAt: DateTime.tryParse(m['savedAt'] as String? ?? ''),
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> write(String key, CachedTheme entry) async {
    await (await _instance).setString(
      '$prefix$key',
      jsonEncode({
        'theme': entry.json,
        'etag': entry.etag,
        'savedAt': (entry.savedAt ?? DateTime.now()).toUtc().toIso8601String(),
      }),
    );
  }

  @override
  Future<void> remove(String key) async => (await _instance).remove('$prefix$key');
}
