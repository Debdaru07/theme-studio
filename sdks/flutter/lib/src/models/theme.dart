import 'dart:convert';

import '../generated/default_theme.g.dart';
import 'color.dart';
import 'components.dart';
import 'effects.dart';
import 'elevation.dart';
import 'json.dart';
import 'layout.dart';
import 'motion.dart';
import 'navigation.dart';
import 'typography.dart';

/// A fully resolved theme (schema v1), as served by `GET /v1/theme`.
///
/// The SDK never merges layers or derives colors; it only parses and maps.
class DtTheme {
  const DtTheme({
    this.schemaVersion = supportedSchemaVersion,
    this.meta,
    required this.color,
    required this.typography,
    required this.spacing,
    required this.sizing,
    required this.shape,
    required this.elevation,
    required this.motion,
    required this.navigation,
    required this.components,
    required this.effects,
    required this.assets,
  });

  /// Highest schema version this SDK understands.
  static const int supportedSchemaVersion = 1;

  /// Parses a decoded theme object.
  ///
  /// Throws [DtUnsupportedSchemaVersionException] for a newer schema and
  /// [DtThemeFormatException] for anything that does not match v1.
  factory DtTheme.fromJson(Map<String, dynamic> json) {
    final r = JsonReader(json);
    final v = r.raw('schemaVersion');
    if (v is num && v > supportedSchemaVersion) {
      throw DtUnsupportedSchemaVersionException(v, supportedSchemaVersion);
    }
    if (v != supportedSchemaVersion) {
      throw DtThemeFormatException('schemaVersion', 'expected $supportedSchemaVersion, got $v');
    }
    return DtTheme(
      schemaVersion: supportedSchemaVersion,
      meta: r.has('meta') ? DtThemeMeta.fromJson(r.obj('meta')) : null,
      color: DtColors.fromJson(r.obj('color')),
      typography: DtTypography.fromJson(r.obj('typography')),
      spacing: DtSpacing.fromJson(r.obj('spacing')),
      sizing: DtSizing.fromJson(r.obj('sizing')),
      shape: DtShape.fromJson(r.obj('shape')),
      elevation: DtElevation.fromJson(r.obj('elevation')),
      motion: DtMotion.fromJson(r.obj('motion')),
      navigation: DtNavigation.fromJson(r.obj('navigation')),
      components: DtComponents.fromJson(r.obj('components')),
      effects: DtEffects.fromJson(r.obj('effects')),
      assets: DtAssets.fromJson(r.obj('assets')),
    );
  }

  /// Parses a JSON string. See [DtTheme.fromJson].
  factory DtTheme.fromJsonString(String source) {
    final Object? decoded;
    try {
      decoded = jsonDecode(source);
    } on FormatException catch (e) {
      throw DtThemeFormatException(r'$', 'invalid JSON: ${e.message}');
    }
    if (decoded is! Map<String, dynamic>) {
      throw const DtThemeFormatException(r'$', 'expected a JSON object');
    }
    return DtTheme.fromJson(decoded);
  }

  /// The platform default theme compiled into the SDK (same as `assets/default_theme.json`).
  static final DtTheme fallback = DtTheme.fromJsonString(kDefaultThemeJson);

  final int schemaVersion;
  final DtThemeMeta? meta;
  final DtColors color;
  final DtTypography typography;
  final DtSpacing spacing;
  final DtSizing sizing;
  final DtShape shape;
  final DtElevation elevation;
  final DtMotion motion;
  final DtNavigation navigation;
  final DtComponents components;
  final DtEffects effects;
  final DtAssets assets;

  /// Content hash from [meta], if present.
  String? get hash => meta?.hash;

  DtTheme copyWith({
    DtThemeMeta? meta,
    DtColors? color,
    DtTypography? typography,
    DtSpacing? spacing,
    DtSizing? sizing,
    DtShape? shape,
    DtElevation? elevation,
    DtMotion? motion,
    DtNavigation? navigation,
    DtComponents? components,
    DtEffects? effects,
    DtAssets? assets,
  }) =>
      DtTheme(
        schemaVersion: schemaVersion,
        meta: meta ?? this.meta,
        color: color ?? this.color,
        typography: typography ?? this.typography,
        spacing: spacing ?? this.spacing,
        sizing: sizing ?? this.sizing,
        shape: shape ?? this.shape,
        elevation: elevation ?? this.elevation,
        motion: motion ?? this.motion,
        navigation: navigation ?? this.navigation,
        components: components ?? this.components,
        effects: effects ?? this.effects,
        assets: assets ?? this.assets,
      );

  Map<String, Object?> toJson() => {
        'schemaVersion': schemaVersion,
        if (meta != null) 'meta': meta!.toJson(),
        'color': color.toJson(),
        'typography': typography.toJson(),
        'spacing': spacing.toJson(),
        'sizing': sizing.toJson(),
        'shape': shape.toJson(),
        'elevation': elevation.toJson(),
        'motion': motion.toJson(),
        'navigation': navigation.toJson(),
        'components': components.toJson(),
        'effects': effects.toJson(),
        'assets': assets.toJson(),
      };

  String toJsonString() => jsonEncode(toJson());
}
