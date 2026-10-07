import 'dart:ui' show Color;

/// Thrown when theme JSON does not match the v1 schema.
class DtThemeFormatException implements Exception {
  const DtThemeFormatException(this.path, this.message);

  /// Dotted path of the offending value, e.g. `color.light.primary`.
  final String path;
  final String message;

  @override
  String toString() => 'DtThemeFormatException at "$path": $message';
}

/// Thrown when the theme was produced by a newer schema than this SDK understands.
class DtUnsupportedSchemaVersionException implements Exception {
  const DtUnsupportedSchemaVersionException(this.found, this.supported);

  final Object? found;
  final int supported;

  @override
  String toString() =>
      'DtUnsupportedSchemaVersionException: theme has schemaVersion $found but this '
      'version of theme_studio supports up to $supported. Upgrade the SDK.';
}

/// Typed, path-aware access to a decoded JSON object.
class JsonReader {
  JsonReader(Object? value, [this.path = r'$'])
      : _map = value is Map<String, dynamic>
            ? value
            : value is Map
                ? value.cast<String, dynamic>()
                : throw DtThemeFormatException(path, 'expected an object, got ${_kind(value)}');

  final Map<String, dynamic> _map;
  final String path;

  String _at(String key) => path == r'$' ? key : '$path.$key';

  Never _fail(String key, String expected, Object? got) =>
      throw DtThemeFormatException(_at(key), 'expected $expected, got ${_kind(got)}');

  bool has(String key) => _map.containsKey(key) && _map[key] != null;

  Object? raw(String key) => _map[key];

  JsonReader obj(String key) {
    final v = _map[key];
    if (v is! Map) _fail(key, 'an object', v);
    return JsonReader(v, _at(key));
  }

  JsonReader? optObj(String key) => has(key) ? obj(key) : null;

  double number(String key) {
    final v = _map[key];
    if (v is! num) _fail(key, 'a number', v);
    return v.toDouble();
  }

  double? optNumber(String key) => _map[key] == null ? null : number(key);

  int integer(String key) {
    final v = _map[key];
    if (v is int) return v;
    if (v is num && v == v.roundToDouble()) return v.toInt();
    _fail(key, 'an integer', v);
  }

  String string(String key) {
    final v = _map[key];
    if (v is! String) _fail(key, 'a string', v);
    return v;
  }

  String? optString(String key) => _map[key] == null ? null : string(key);

  bool boolean(String key) {
    final v = _map[key];
    if (v is! bool) _fail(key, 'a boolean', v);
    return v;
  }

  bool? optBoolean(String key) => _map[key] == null ? null : boolean(key);

  Color color(String key) {
    final v = _map[key];
    if (v is! String) _fail(key, 'a hex color', v);
    final c = parseHexColor(v);
    if (c == null) throw DtThemeFormatException(_at(key), 'invalid hex color "$v"');
    return c;
  }

  T enumValue<T extends Enum>(String key, List<T> values) {
    final v = _map[key];
    for (final e in values) {
      if (e.name == v) return e;
    }
    throw DtThemeFormatException(
      _at(key),
      'expected one of ${values.map((e) => e.name).join(', ')}, got ${_kind(v)}',
    );
  }

  List<double> numberList(String key, {int? length}) {
    final v = _map[key];
    if (v is! List || v.any((e) => e is! num) || (length != null && v.length != length)) {
      _fail(key, length == null ? 'a list of numbers' : 'a list of $length numbers', v);
    }
    return [for (final e in v) (e as num).toDouble()];
  }

  List<String> stringList(String key) {
    final v = _map[key];
    if (v is! List || v.any((e) => e is! String)) _fail(key, 'a list of strings', v);
    return v.cast<String>().toList(growable: false);
  }
}

String _kind(Object? v) => switch (v) {
      null => 'null',
      String() => 'string "$v"',
      num() => 'number $v',
      bool() => 'boolean $v',
      List() => 'a list',
      Map() => 'an object',
      _ => v.runtimeType.toString(),
    };

/// Parses `#RRGGBB` or `#RRGGBBAA` (CSS order, alpha last).
Color? parseHexColor(String hex) {
  final m = RegExp(r'^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$').firstMatch(hex);
  if (m == null) return null;
  final h = m.group(1)!;
  final rgb = int.parse(h.substring(0, 6), radix: 16);
  final a = h.length == 8 ? int.parse(h.substring(6), radix: 16) : 0xFF;
  return Color((a << 24) | rgb);
}

/// Formats as uppercase `#RRGGBB`, or `#RRGGBBAA` when not fully opaque.
String toHexColor(Color c) {
  final argb = c.toARGB32();
  final rgb = (argb & 0xFFFFFF).toRadixString(16).padLeft(6, '0');
  final a = (argb >> 24) & 0xFF;
  final out = a == 0xFF ? rgb : rgb + a.toRadixString(16).padLeft(2, '0');
  return '#${out.toUpperCase()}';
}

/// Emits integral doubles as ints so round-tripped JSON matches the source.
num jsonNum(double v) => v == v.roundToDouble() && v.abs() < 1e15 ? v.toInt() : v;
