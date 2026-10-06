import 'dart:ui' show Brightness;

import 'package:flutter/painting.dart';

import 'json.dart';

class DtShadow {
  const DtShadow({required this.offsetY, required this.blur, required this.spread, required this.opacity});

  factory DtShadow.fromJson(JsonReader r) => DtShadow(
        offsetY: r.number('offsetY'),
        blur: r.number('blur'),
        spread: r.number('spread'),
        opacity: r.number('opacity'),
      );

  final double offsetY;
  final double blur;
  final double spread;

  /// Applied to the mode's shadow color.
  final double opacity;

  /// Empty for a zero-opacity shadow so `BoxDecoration` paints nothing.
  List<BoxShadow> toBoxShadows(Color shadowColor) => opacity <= 0
      ? const []
      : [
          BoxShadow(
            color: shadowColor.withValues(alpha: shadowColor.a * opacity),
            offset: Offset(0, offsetY),
            blurRadius: blur,
            spreadRadius: spread,
          ),
        ];

  Map<String, Object?> toJson() => {
        'offsetY': jsonNum(offsetY),
        'blur': jsonNum(blur),
        'spread': jsonNum(spread),
        'opacity': jsonNum(opacity),
      };
}

class DtZIndex {
  const DtZIndex({
    required this.dropdown,
    required this.sticky,
    required this.overlay,
    required this.modal,
    required this.toast,
  });

  factory DtZIndex.fromJson(JsonReader r) => DtZIndex(
        dropdown: r.integer('dropdown'),
        sticky: r.integer('sticky'),
        overlay: r.integer('overlay'),
        modal: r.integer('modal'),
        toast: r.integer('toast'),
      );

  final int dropdown;
  final int sticky;
  final int overlay;
  final int modal;
  final int toast;

  Map<String, Object?> toJson() =>
      {'dropdown': dropdown, 'sticky': sticky, 'overlay': overlay, 'modal': modal, 'toast': toast};
}

class DtElevation {
  const DtElevation({
    required this.shadowColorLight,
    required this.shadowColorDark,
    required this.levels,
    required this.zIndex,
  }) : assert(levels.length == levelCount);

  static const int levelCount = 6;

  factory DtElevation.fromJson(JsonReader r) {
    final sc = r.obj('shadowColor');
    final lv = r.obj('levels');
    return DtElevation(
      shadowColorLight: sc.color('light'),
      shadowColorDark: sc.color('dark'),
      levels: [for (var i = 0; i < levelCount; i++) DtShadow.fromJson(lv.obj('level$i'))],
      zIndex: DtZIndex.fromJson(r.obj('zIndex')),
    );
  }

  final Color shadowColorLight;
  final Color shadowColorDark;

  /// `level0` … `level5`.
  final List<DtShadow> levels;
  final DtZIndex zIndex;

  Color shadowColor(Brightness b) => b == Brightness.dark ? shadowColorDark : shadowColorLight;

  /// Box shadows for [level] (clamped to 0–5) in mode [b].
  List<BoxShadow> shadows(int level, Brightness b) =>
      levels[level.clamp(0, levelCount - 1)].toBoxShadows(shadowColor(b));

  Map<String, Object?> toJson() => {
        'shadowColor': {'light': toHexColor(shadowColorLight), 'dark': toHexColor(shadowColorDark)},
        'levels': {for (var i = 0; i < levelCount; i++) 'level$i': levels[i].toJson()},
        'zIndex': zIndex.toJson(),
      };
}
