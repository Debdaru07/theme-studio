import 'breakpoint.dart';
import 'json.dart';

/// One text style. [lineHeight] and [letterSpacing] are absolute px.
class DtTextStyle {
  const DtTextStyle({
    required this.family,
    required this.size,
    required this.weight,
    required this.lineHeight,
    required this.letterSpacing,
  });

  factory DtTextStyle.fromJson(JsonReader r) => DtTextStyle(
        family: r.string('family'),
        size: r.number('size'),
        weight: r.integer('weight'),
        lineHeight: r.number('lineHeight'),
        letterSpacing: r.number('letterSpacing'),
      );

  final String family;
  final double size;

  /// 100–900 in steps of 100.
  final int weight;
  final double lineHeight;
  final double letterSpacing;

  /// Flutter's `TextStyle.height` multiplier.
  double get heightFactor => size == 0 ? 1 : lineHeight / size;

  DtTextStyle copyWith({String? family, double? size, int? weight, double? lineHeight, double? letterSpacing}) =>
      DtTextStyle(
        family: family ?? this.family,
        size: size ?? this.size,
        weight: weight ?? this.weight,
        lineHeight: lineHeight ?? this.lineHeight,
        letterSpacing: letterSpacing ?? this.letterSpacing,
      );

  /// Scales size and line height together (letter spacing is kept).
  DtTextStyle scaled(double factor) =>
      factor == 1 ? this : copyWith(size: size * factor, lineHeight: lineHeight * factor);

  Map<String, Object?> toJson() => {
        'family': family,
        'size': jsonNum(size),
        'weight': weight,
        'lineHeight': jsonNum(lineHeight),
        'letterSpacing': jsonNum(letterSpacing),
      };
}

class DtFontFamilies {
  const DtFontFamilies({required this.primary, required this.secondary, required this.mono});

  factory DtFontFamilies.fromJson(JsonReader r) =>
      DtFontFamilies(primary: r.string('primary'), secondary: r.string('secondary'), mono: r.string('mono'));

  final String primary;
  final String secondary;
  final String mono;

  Map<String, Object?> toJson() => {'primary': primary, 'secondary': secondary, 'mono': mono};
}

/// The ten schema text styles.
class DtTextStyles {
  const DtTextStyles({
    required this.display,
    required this.headline,
    required this.titleLarge,
    required this.titleMedium,
    required this.bodyLarge,
    required this.bodyMedium,
    required this.bodySmall,
    required this.labelLarge,
    required this.labelMedium,
    required this.caption,
  });

  factory DtTextStyles.fromJson(JsonReader r) {
    DtTextStyle s(String k) => DtTextStyle.fromJson(r.obj(k));
    return DtTextStyles(
      display: s('display'),
      headline: s('headline'),
      titleLarge: s('titleLarge'),
      titleMedium: s('titleMedium'),
      bodyLarge: s('bodyLarge'),
      bodyMedium: s('bodyMedium'),
      bodySmall: s('bodySmall'),
      labelLarge: s('labelLarge'),
      labelMedium: s('labelMedium'),
      caption: s('caption'),
    );
  }

  final DtTextStyle display;
  final DtTextStyle headline;
  final DtTextStyle titleLarge;
  final DtTextStyle titleMedium;
  final DtTextStyle bodyLarge;
  final DtTextStyle bodyMedium;
  final DtTextStyle bodySmall;
  final DtTextStyle labelLarge;
  final DtTextStyle labelMedium;
  final DtTextStyle caption;

  Map<String, Object?> toJson() => {
        'display': display.toJson(),
        'headline': headline.toJson(),
        'titleLarge': titleLarge.toJson(),
        'titleMedium': titleMedium.toJson(),
        'bodyLarge': bodyLarge.toJson(),
        'bodyMedium': bodyMedium.toJson(),
        'bodySmall': bodySmall.toJson(),
        'labelLarge': labelLarge.toJson(),
        'labelMedium': labelMedium.toJson(),
        'caption': caption.toJson(),
      };
}

class DtTypography {
  const DtTypography({required this.fontFamily, required this.styles, required this.responsiveScale});

  factory DtTypography.fromJson(JsonReader r) => DtTypography(
        fontFamily: DtFontFamilies.fromJson(r.obj('fontFamily')),
        styles: DtTextStyles.fromJson(r.obj('styles')),
        responsiveScale: DtPerBreakpoint.fromJson(r.obj('responsiveScale'), (r, k) => r.number(k)),
      );

  final DtFontFamilies fontFamily;
  final DtTextStyles styles;

  /// Multiplier for `display` and `headline` only.
  final DtPerBreakpoint<double> responsiveScale;

  Map<String, Object?> toJson() => {
        'fontFamily': fontFamily.toJson(),
        'styles': styles.toJson(),
        'responsiveScale': responsiveScale.toJson((v) => jsonNum(v)),
      };
}
