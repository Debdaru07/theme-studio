import 'dart:math' as math;
import 'dart:ui' show Brightness;

import 'package:flutter/painting.dart';

import 'color.dart';
import 'json.dart';

class DtOpacities {
  const DtOpacities({required this.hover, required this.pressed, required this.disabled});

  factory DtOpacities.fromJson(JsonReader r) =>
      DtOpacities(hover: r.number('hover'), pressed: r.number('pressed'), disabled: r.number('disabled'));

  final double hover;
  final double pressed;
  final double disabled;

  Map<String, Object?> toJson() => {'hover': jsonNum(hover), 'pressed': jsonNum(pressed), 'disabled': jsonNum(disabled)};
}

class DtFocusRing {
  const DtFocusRing({required this.width, required this.offset});

  factory DtFocusRing.fromJson(JsonReader r) => DtFocusRing(width: r.number('width'), offset: r.number('offset'));

  final double width;
  final double offset;

  Map<String, Object?> toJson() => {'width': jsonNum(width), 'offset': jsonNum(offset)};
}

class DtBlur {
  const DtBlur({required this.sm, required this.md});

  factory DtBlur.fromJson(JsonReader r) => DtBlur(sm: r.number('sm'), md: r.number('md'));

  final double sm;
  final double md;

  Map<String, Object?> toJson() => {'sm': jsonNum(sm), 'md': jsonNum(md)};
}

class DtGradientTokens {
  const DtGradientTokens({required this.enabled, required this.angle, required this.stops});

  factory DtGradientTokens.fromJson(JsonReader r) =>
      DtGradientTokens(enabled: r.boolean('enabled'), angle: r.number('angle'), stops: r.stringList('stops'));

  final bool enabled;

  /// CSS-style degrees: 0 points up, 90 points right.
  final double angle;

  /// Color role names, resolved per mode.
  final List<String> stops;

  /// The brand gradient for [colors], or null when disabled.
  LinearGradient? resolve(DtColorScheme colors) {
    if (!enabled) return null;
    final resolved = [for (final s in stops) colors.byName(s)].whereType<Color>().toList();
    if (resolved.length < 2) return null;
    final rad = angle * math.pi / 180;
    var x = math.sin(rad), y = -math.cos(rad);
    final m = math.max(x.abs(), y.abs());
    x /= m;
    y /= m;
    return LinearGradient(begin: Alignment(-x, -y), end: Alignment(x, y), colors: resolved);
  }

  Map<String, Object?> toJson() => {'enabled': enabled, 'angle': jsonNum(angle), 'stops': stops};
}

class DtEffects {
  const DtEffects({required this.opacity, required this.focusRing, required this.blur, required this.gradient});

  factory DtEffects.fromJson(JsonReader r) => DtEffects(
        opacity: DtOpacities.fromJson(r.obj('opacity')),
        focusRing: DtFocusRing.fromJson(r.obj('focusRing')),
        blur: DtBlur.fromJson(r.obj('blur')),
        gradient: DtGradientTokens.fromJson(r.obj('gradient')),
      );

  final DtOpacities opacity;
  final DtFocusRing focusRing;
  final DtBlur blur;
  final DtGradientTokens gradient;

  Map<String, Object?> toJson() => {
        'opacity': opacity.toJson(),
        'focusRing': focusRing.toJson(),
        'blur': blur.toJson(),
        'gradient': gradient.toJson(),
      };
}

class DtAssets {
  const DtAssets({required this.appName, this.logoLight, this.logoDark, this.favicon});

  factory DtAssets.fromJson(JsonReader r) {
    final logo = r.obj('logo');
    return DtAssets(
      appName: r.string('appName'),
      logoLight: logo.optString('light'),
      logoDark: logo.optString('dark'),
      favicon: r.optString('favicon'),
    );
  }

  final String appName;
  final String? logoLight;
  final String? logoDark;
  final String? favicon;

  /// Logo URL for [b], falling back to the other mode's logo.
  String? logo(Brightness b) => b == Brightness.dark ? (logoDark ?? logoLight) : (logoLight ?? logoDark);

  Map<String, Object?> toJson() => {
        'appName': appName,
        'logo': {'light': logoLight, 'dark': logoDark},
        'favicon': favicon,
      };
}

class DtThemeMeta {
  const DtThemeMeta({
    required this.tenant,
    required this.client,
    required this.version,
    required this.publishedAt,
    required this.hash,
  });

  factory DtThemeMeta.fromJson(JsonReader r) => DtThemeMeta(
        tenant: r.string('tenant'),
        client: r.optString('client'),
        version: r.integer('version'),
        publishedAt: r.optString('publishedAt'),
        hash: r.string('hash'),
      );

  final String tenant;

  /// Null for a tenant base theme.
  final String? client;
  final int version;

  /// ISO-8601 timestamp string as served.
  final String? publishedAt;

  /// Content hash; the API uses it as the ETag.
  final String hash;

  DateTime? get publishedAtDate => publishedAt == null ? null : DateTime.tryParse(publishedAt!);

  Map<String, Object?> toJson() =>
      {'tenant': tenant, 'client': client, 'version': version, 'publishedAt': publishedAt, 'hash': hash};
}
