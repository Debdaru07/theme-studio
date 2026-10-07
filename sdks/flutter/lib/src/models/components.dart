import 'json.dart';

/// The theme's default button variant (`components.button.variant`). [DtButtonKind] has all five.
enum DtButtonVariant {
  filled,
  tonal,
  outlined;

  /// The same variant as a [DtButtonKind].
  DtButtonKind get kind => switch (this) {
        DtButtonVariant.filled => DtButtonKind.filled,
        DtButtonVariant.tonal => DtButtonKind.tonal,
        DtButtonVariant.outlined => DtButtonKind.outlined,
      };
}

/// Every button variant the theme tunes (`components.button.variants`), keyed by [name].
enum DtButtonKind { filled, tonal, outlined, text, danger }

/// Button sizes (`components.button.sizes`), keyed by [name].
enum DtButtonSize { sm, md, lg }

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

/// Height, horizontal padding and text style for one control size (`sm`, `md`, `lg`).
class DtControlSize {
  const DtControlSize({required this.height, required this.paddingX, required this.textStyle});

  factory DtControlSize.fromJson(JsonReader r) =>
      DtControlSize(height: r.number('height'), paddingX: r.number('paddingX'), textStyle: r.string('textStyle'));

  final double height;
  final double paddingX;

  /// A text style name from the theme, e.g. `labelLarge`.
  final String textStyle;

  Map<String, Object?> toJson() => {'height': jsonNum(height), 'paddingX': jsonNum(paddingX), 'textStyle': textStyle};
}

/// Colors (theme color role names) and elevation for one button variant.
class DtButtonVariantStyle {
  const DtButtonVariantStyle({required this.container, required this.content, required this.border, this.elevation = 0});

  factory DtButtonVariantStyle.fromJson(JsonReader r) => DtButtonVariantStyle(
        container: r.string('container'),
        content: r.string('content'),
        border: r.string('border'),
        elevation: r.integer('elevation'),
      );

  /// A color role (e.g. `primary`) or `transparent`.
  final String container;

  /// A color role, e.g. `onPrimary`.
  final String content;

  /// A color role or `transparent`.
  final String border;

  /// Elevation level 0–5.
  final int elevation;

  Map<String, Object?> toJson() => {'container': container, 'content': content, 'border': border, 'elevation': elevation};
}

/// Defaults for themes published before component tuning existed (they match the platform defaults).
const _defaultVariants = <String, DtButtonVariantStyle>{
  'filled': DtButtonVariantStyle(container: 'primary', content: 'onPrimary', border: 'transparent'),
  'tonal': DtButtonVariantStyle(container: 'secondaryContainer', content: 'onSecondaryContainer', border: 'transparent'),
  'outlined': DtButtonVariantStyle(container: 'transparent', content: 'primary', border: 'outline'),
  'text': DtButtonVariantStyle(container: 'transparent', content: 'primary', border: 'transparent'),
  'danger': DtButtonVariantStyle(container: 'error', content: 'onError', border: 'transparent'),
};

class DtButtonTokens {
  const DtButtonTokens({
    required this.variant,
    required this.radius,
    required this.height,
    required this.paddingX,
    required this.textTransform,
    this.borderWidth = 1,
    this.iconGap = 8,
    Map<String, DtControlSize>? sizes,
    Map<String, DtButtonVariantStyle>? variants,
  })  : _sizes = sizes,
        variants = variants ?? _defaultVariants;

  factory DtButtonTokens.fromJson(JsonReader r) {
    final height = r.number('height');
    final paddingX = r.number('paddingX');
    final sizes = r.optObj('sizes');
    final variants = r.optObj('variants');
    return DtButtonTokens(
      variant: r.enumValue('variant', DtButtonVariant.values),
      radius: r.number('radius'),
      height: height,
      paddingX: paddingX,
      textTransform: r.enumValue('textTransform', DtTextTransform.values),
      borderWidth: r.optNumber('borderWidth') ?? 1,
      iconGap: r.optNumber('iconGap') ?? 8,
      sizes: sizes == null ? null : {for (final s in const ['sm', 'md', 'lg']) s: DtControlSize.fromJson(sizes.obj(s))},
      variants: variants == null
          ? null
          : {for (final v in _defaultVariants.keys) v: DtButtonVariantStyle.fromJson(variants.obj(v))},
    );
  }

  /// The variant `DtButton` uses when none is given.
  final DtButtonVariant variant;
  final double radius;

  /// Medium height and padding (`sizes['md']` mirrors these).
  final double height;
  final double paddingX;
  final DtTextTransform textTransform;
  final double borderWidth;
  final double iconGap;
  final Map<String, DtControlSize>? _sizes;

  /// Keyed by `filled`, `tonal`, `outlined`, `text`, `danger`.
  final Map<String, DtButtonVariantStyle> variants;

  /// Keyed by `sm`, `md`, `lg`. Older themes fall back to the platform defaults around [height]/[paddingX].
  Map<String, DtControlSize> get sizes =>
      _sizes ??
      {
        'sm': const DtControlSize(height: 32, paddingX: 12, textStyle: 'labelMedium'),
        'md': DtControlSize(height: height, paddingX: paddingX, textStyle: 'labelLarge'),
        'lg': const DtControlSize(height: 48, paddingX: 32, textStyle: 'labelLarge'),
      };

  /// Height, padding and text style for [size].
  DtControlSize size(DtButtonSize size) => sizes[size.name]!;

  /// Colors and elevation for [kind].
  DtButtonVariantStyle style(DtButtonKind kind) => variants[kind.name] ?? _defaultVariants[kind.name]!;

  Map<String, Object?> toJson() => {
        'variant': variant.name,
        'radius': jsonNum(radius),
        'height': jsonNum(height),
        'paddingX': jsonNum(paddingX),
        'textTransform': textTransform.name,
        'borderWidth': jsonNum(borderWidth),
        'iconGap': jsonNum(iconGap),
        'sizes': {for (final e in sizes.entries) e.key: e.value.toJson()},
        'variants': {for (final e in variants.entries) e.key: e.value.toJson()},
      };
}

class DtInputTokens {
  const DtInputTokens({
    required this.variant,
    required this.radius,
    required this.height,
    this.borderWidth = 1,
    this.paddingX = 12,
    this.labelGap = 4,
  });

  factory DtInputTokens.fromJson(JsonReader r) => DtInputTokens(
        variant: r.enumValue('variant', DtInputVariant.values),
        radius: r.number('radius'),
        height: r.number('height'),
        borderWidth: r.optNumber('borderWidth') ?? 1,
        paddingX: r.optNumber('paddingX') ?? 12,
        labelGap: r.optNumber('labelGap') ?? 4,
      );

  final DtInputVariant variant;
  final double radius;
  final double height;
  final double borderWidth;
  final double paddingX;

  /// Space between the label and the field.
  final double labelGap;

  Map<String, Object?> toJson() => {
        'variant': variant.name,
        'radius': jsonNum(radius),
        'height': jsonNum(height),
        'borderWidth': jsonNum(borderWidth),
        'paddingX': jsonNum(paddingX),
        'labelGap': jsonNum(labelGap),
      };
}

class DtCardTokens {
  const DtCardTokens({required this.radius, required this.elevation, required this.bordered, this.padding = 16, this.gap = 8});

  factory DtCardTokens.fromJson(JsonReader r) => DtCardTokens(
        radius: r.number('radius'),
        elevation: r.integer('elevation'),
        bordered: r.boolean('bordered'),
        padding: r.optNumber('padding') ?? 16,
        gap: r.optNumber('gap') ?? 8,
      );

  final double radius;

  /// Elevation level 0–5.
  final int elevation;
  final bool bordered;
  final double padding;
  final double gap;

  Map<String, Object?> toJson() => {
        'radius': jsonNum(radius),
        'elevation': elevation,
        'bordered': bordered,
        'padding': jsonNum(padding),
        'gap': jsonNum(gap),
      };
}

class DtDialogTokens {
  const DtDialogTokens({required this.radius, required this.elevation, this.padding = 24, this.actionGap = 8});

  factory DtDialogTokens.fromJson(JsonReader r) => DtDialogTokens(
        radius: r.number('radius'),
        elevation: r.integer('elevation'),
        padding: r.optNumber('padding') ?? 24,
        actionGap: r.optNumber('actionGap') ?? 8,
      );

  final double radius;

  /// Elevation level 0–5.
  final int elevation;
  final double padding;
  final double actionGap;

  Map<String, Object?> toJson() =>
      {'radius': jsonNum(radius), 'elevation': elevation, 'padding': jsonNum(padding), 'actionGap': jsonNum(actionGap)};
}

class DtChipTokens {
  const DtChipTokens({
    required this.radius,
    this.height = 32,
    this.paddingX = 12,
    this.iconGap = 4,
    this.selectedContainer = 'secondaryContainer',
    this.selectedContent = 'onSecondaryContainer',
  });

  factory DtChipTokens.fromJson(JsonReader r) {
    final selected = r.optObj('selected');
    return DtChipTokens(
      radius: r.number('radius'),
      height: r.optNumber('height') ?? 32,
      paddingX: r.optNumber('paddingX') ?? 12,
      iconGap: r.optNumber('iconGap') ?? 4,
      selectedContainer: selected?.string('container') ?? 'secondaryContainer',
      selectedContent: selected?.string('content') ?? 'onSecondaryContainer',
    );
  }

  final double radius;
  final double height;
  final double paddingX;
  final double iconGap;

  /// Color role names for the selected state.
  final String selectedContainer;
  final String selectedContent;

  Map<String, Object?> toJson() => {
        'radius': jsonNum(radius),
        'height': jsonNum(height),
        'paddingX': jsonNum(paddingX),
        'iconGap': jsonNum(iconGap),
        'selected': {'container': selectedContainer, 'content': selectedContent},
      };
}

class DtBadgeTokens {
  const DtBadgeTokens({required this.radius, this.paddingX = 4});

  factory DtBadgeTokens.fromJson(JsonReader r) =>
      DtBadgeTokens(radius: r.number('radius'), paddingX: r.optNumber('paddingX') ?? 4);

  final double radius;
  final double paddingX;

  Map<String, Object?> toJson() => {'radius': jsonNum(radius), 'paddingX': jsonNum(paddingX)};
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
        chip: DtChipTokens.fromJson(r.obj('chip')),
        badge: DtBadgeTokens.fromJson(r.obj('badge')),
      );

  final DtButtonTokens button;
  final DtInputTokens input;
  final DtCardTokens card;
  final DtDialogTokens dialog;
  final DtChipTokens chip;
  final DtBadgeTokens badge;

  Map<String, Object?> toJson() => {
        'button': button.toJson(),
        'input': input.toJson(),
        'card': card.toJson(),
        'dialog': dialog.toJson(),
        'chip': chip.toJson(),
        'badge': badge.toJson(),
      };
}

/// The radius-only model chips and badges shared before component tuning. `DtRadiusTokens(radius: r)` still works.
@Deprecated('Use DtChipTokens or DtBadgeTokens')
typedef DtRadiusTokens = DtBadgeTokens;
