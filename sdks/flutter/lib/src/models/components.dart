import 'json.dart';

enum DtButtonVariant { filled, tonal, outlined }

enum DtTextTransform {
  none,
  uppercase,
  capitalize;

  String apply(String text) => switch (this) {
        DtTextTransform.none => text,
        DtTextTransform.uppercase => text.toUpperCase(),
        DtTextTransform.capitalize => text.replaceAllMapped(
            RegExp(r'(^|\s)(\S)'),
            (m) => '${m[1]}${m[2]!.toUpperCase()}',
          ),
      };
}

enum DtInputVariant { filled, outlined }

class DtButtonTokens {
  const DtButtonTokens({
    required this.variant,
    required this.radius,
    required this.height,
    required this.paddingX,
    required this.textTransform,
  });

  factory DtButtonTokens.fromJson(JsonReader r) => DtButtonTokens(
        variant: r.enumValue('variant', DtButtonVariant.values),
        radius: r.number('radius'),
        height: r.number('height'),
        paddingX: r.number('paddingX'),
        textTransform: r.enumValue('textTransform', DtTextTransform.values),
      );

  final DtButtonVariant variant;
  final double radius;
  final double height;
  final double paddingX;
  final DtTextTransform textTransform;

  Map<String, Object?> toJson() => {
        'variant': variant.name,
        'radius': jsonNum(radius),
        'height': jsonNum(height),
        'paddingX': jsonNum(paddingX),
        'textTransform': textTransform.name,
      };
}

class DtInputTokens {
  const DtInputTokens({required this.variant, required this.radius, required this.height});

  factory DtInputTokens.fromJson(JsonReader r) => DtInputTokens(
        variant: r.enumValue('variant', DtInputVariant.values),
        radius: r.number('radius'),
        height: r.number('height'),
      );

  final DtInputVariant variant;
  final double radius;
  final double height;

  Map<String, Object?> toJson() => {'variant': variant.name, 'radius': jsonNum(radius), 'height': jsonNum(height)};
}

class DtCardTokens {
  const DtCardTokens({required this.radius, required this.elevation, required this.bordered});

  factory DtCardTokens.fromJson(JsonReader r) =>
      DtCardTokens(radius: r.number('radius'), elevation: r.integer('elevation'), bordered: r.boolean('bordered'));

  final double radius;

  /// Elevation level 0–5.
  final int elevation;
  final bool bordered;

  Map<String, Object?> toJson() => {'radius': jsonNum(radius), 'elevation': elevation, 'bordered': bordered};
}

class DtDialogTokens {
  const DtDialogTokens({required this.radius, required this.elevation});

  factory DtDialogTokens.fromJson(JsonReader r) =>
      DtDialogTokens(radius: r.number('radius'), elevation: r.integer('elevation'));

  final double radius;

  /// Elevation level 0–5.
  final int elevation;

  Map<String, Object?> toJson() => {'radius': jsonNum(radius), 'elevation': elevation};
}

/// Components that only carry a radius (chip, badge).
class DtRadiusTokens {
  const DtRadiusTokens({required this.radius});

  factory DtRadiusTokens.fromJson(JsonReader r) => DtRadiusTokens(radius: r.number('radius'));

  final double radius;

  Map<String, Object?> toJson() => {'radius': jsonNum(radius)};
}

class DtComponents {
  const DtComponents({
    required this.button,
    required this.input,
    required this.card,
    required this.dialog,
    required this.chip,
    required this.badge,
  });

  factory DtComponents.fromJson(JsonReader r) => DtComponents(
        button: DtButtonTokens.fromJson(r.obj('button')),
        input: DtInputTokens.fromJson(r.obj('input')),
        card: DtCardTokens.fromJson(r.obj('card')),
        dialog: DtDialogTokens.fromJson(r.obj('dialog')),
        chip: DtRadiusTokens.fromJson(r.obj('chip')),
        badge: DtRadiusTokens.fromJson(r.obj('badge')),
      );

  final DtButtonTokens button;
  final DtInputTokens input;
  final DtCardTokens card;
  final DtDialogTokens dialog;
  final DtRadiusTokens chip;
  final DtRadiusTokens badge;

  Map<String, Object?> toJson() => {
        'button': button.toJson(),
        'input': input.toJson(),
        'card': card.toJson(),
        'dialog': dialog.toJson(),
        'chip': chip.toJson(),
        'badge': badge.toJson(),
      };
}
