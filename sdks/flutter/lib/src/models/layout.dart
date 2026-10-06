import 'dart:ui' show lerpDouble;

import 'breakpoint.dart';
import 'json.dart';

double _l(double a, double b, double t) => lerpDouble(a, b, t)!;

/// 4px-grid spacing scale. JSON keys `2xl`/`3xl` map to [xxl]/[xxxl].
class DtSpacingScale {
  const DtSpacingScale({
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
    required this.xxl,
    required this.xxxl,
  });

  factory DtSpacingScale.fromJson(JsonReader r) => DtSpacingScale(
        xs: r.number('xs'),
        sm: r.number('sm'),
        md: r.number('md'),
        lg: r.number('lg'),
        xl: r.number('xl'),
        xxl: r.number('2xl'),
        xxxl: r.number('3xl'),
      );

  final double xs;
  final double sm;
  final double md;
  final double lg;
  final double xl;
  final double xxl;
  final double xxxl;

  Map<String, Object?> toJson() => {
        'xs': jsonNum(xs),
        'sm': jsonNum(sm),
        'md': jsonNum(md),
        'lg': jsonNum(lg),
        'xl': jsonNum(xl),
        '2xl': jsonNum(xxl),
        '3xl': jsonNum(xxxl),
      };

  static DtSpacingScale lerp(DtSpacingScale a, DtSpacingScale b, double t) => DtSpacingScale(
        xs: _l(a.xs, b.xs, t),
        sm: _l(a.sm, b.sm, t),
        md: _l(a.md, b.md, t),
        lg: _l(a.lg, b.lg, t),
        xl: _l(a.xl, b.xl, t),
        xxl: _l(a.xxl, b.xxl, t),
        xxxl: _l(a.xxxl, b.xxxl, t),
      );
}

/// Page-level layout values for one breakpoint.
class DtLayout {
  const DtLayout({
    required this.pagePadding,
    required this.sectionGap,
    required this.cardGap,
    required this.contentMaxWidth,
  });

  factory DtLayout.fromJson(JsonReader r) => DtLayout(
        pagePadding: r.number('pagePadding'),
        sectionGap: r.number('sectionGap'),
        cardGap: r.number('cardGap'),
        contentMaxWidth: r.optNumber('contentMaxWidth'),
      );

  final double pagePadding;
  final double sectionGap;
  final double cardGap;

  /// `null` means unconstrained.
  final double? contentMaxWidth;

  Map<String, Object?> toJson() => {
        'pagePadding': jsonNum(pagePadding),
        'sectionGap': jsonNum(sectionGap),
        'cardGap': jsonNum(cardGap),
        'contentMaxWidth': contentMaxWidth == null ? null : jsonNum(contentMaxWidth!),
      };
}

class DtComponentSpacing {
  const DtComponentSpacing({
    required this.cardPadding,
    required this.dialogPadding,
    required this.listGap,
    required this.formGap,
  });

  factory DtComponentSpacing.fromJson(JsonReader r) => DtComponentSpacing(
        cardPadding: r.number('cardPadding'),
        dialogPadding: r.number('dialogPadding'),
        listGap: r.number('listGap'),
        formGap: r.number('formGap'),
      );

  final double cardPadding;
  final double dialogPadding;
  final double listGap;
  final double formGap;

  Map<String, Object?> toJson() => {
        'cardPadding': jsonNum(cardPadding),
        'dialogPadding': jsonNum(dialogPadding),
        'listGap': jsonNum(listGap),
        'formGap': jsonNum(formGap),
      };
}

class DtSpacing {
  const DtSpacing({required this.scale, required this.layout, required this.component});

  factory DtSpacing.fromJson(JsonReader r) => DtSpacing(
        scale: DtSpacingScale.fromJson(r.obj('scale')),
        layout: DtPerBreakpoint.fromJson(r.obj('layout'), (r, k) => DtLayout.fromJson(r.obj(k))),
        component: DtComponentSpacing.fromJson(r.obj('component')),
      );

  final DtSpacingScale scale;
  final DtPerBreakpoint<DtLayout> layout;
  final DtComponentSpacing component;

  Map<String, Object?> toJson() => {
        'scale': scale.toJson(),
        'layout': layout.toJson((v) => v.toJson()),
        'component': component.toJson(),
      };
}

/// A small/medium/large size triple (icons, control heights).
class DtSizeSet {
  const DtSizeSet({required this.sm, required this.md, required this.lg});

  factory DtSizeSet.fromJson(JsonReader r) => DtSizeSet(sm: r.number('sm'), md: r.number('md'), lg: r.number('lg'));

  final double sm;
  final double md;
  final double lg;

  Map<String, Object?> toJson() => {'sm': jsonNum(sm), 'md': jsonNum(md), 'lg': jsonNum(lg)};
}

class DtSizing {
  const DtSizing({
    required this.breakpoints,
    required this.icon,
    required this.controlHeight,
    required this.minTouchTarget,
  });

  factory DtSizing.fromJson(JsonReader r) => DtSizing(
        breakpoints: DtBreakpoints.fromJson(r.obj('breakpoints')),
        icon: DtSizeSet.fromJson(r.obj('icon')),
        controlHeight: DtSizeSet.fromJson(r.obj('controlHeight')),
        minTouchTarget: r.number('minTouchTarget'),
      );

  final DtBreakpoints breakpoints;
  final DtSizeSet icon;
  final DtSizeSet controlHeight;
  final double minTouchTarget;

  Map<String, Object?> toJson() => {
        'breakpoints': breakpoints.toJson(),
        'icon': icon.toJson(),
        'controlHeight': controlHeight.toJson(),
        'minTouchTarget': jsonNum(minTouchTarget),
      };
}

class DtRadii {
  const DtRadii({
    required this.none,
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
    required this.full,
  });

  factory DtRadii.fromJson(JsonReader r) => DtRadii(
        none: r.number('none'),
        xs: r.number('xs'),
        sm: r.number('sm'),
        md: r.number('md'),
        lg: r.number('lg'),
        xl: r.number('xl'),
        full: r.number('full'),
      );

  final double none;
  final double xs;
  final double sm;
  final double md;
  final double lg;
  final double xl;
  final double full;

  Map<String, Object?> toJson() => {
        'none': jsonNum(none),
        'xs': jsonNum(xs),
        'sm': jsonNum(sm),
        'md': jsonNum(md),
        'lg': jsonNum(lg),
        'xl': jsonNum(xl),
        'full': jsonNum(full),
      };

  static DtRadii lerp(DtRadii a, DtRadii b, double t) => DtRadii(
        none: _l(a.none, b.none, t),
        xs: _l(a.xs, b.xs, t),
        sm: _l(a.sm, b.sm, t),
        md: _l(a.md, b.md, t),
        lg: _l(a.lg, b.lg, t),
        xl: _l(a.xl, b.xl, t),
        full: _l(a.full, b.full, t),
      );
}

class DtBorderWidths {
  const DtBorderWidths({required this.thin, required this.thick});

  factory DtBorderWidths.fromJson(JsonReader r) => DtBorderWidths(thin: r.number('thin'), thick: r.number('thick'));

  final double thin;
  final double thick;

  Map<String, Object?> toJson() => {'thin': jsonNum(thin), 'thick': jsonNum(thick)};
}

enum DtCornerStyle { rounded, cut }

class DtShape {
  const DtShape({required this.radius, required this.borderWidth, required this.cornerStyle});

  factory DtShape.fromJson(JsonReader r) => DtShape(
        radius: DtRadii.fromJson(r.obj('radius')),
        borderWidth: DtBorderWidths.fromJson(r.obj('borderWidth')),
        cornerStyle: r.enumValue('cornerStyle', DtCornerStyle.values),
      );

  final DtRadii radius;
  final DtBorderWidths borderWidth;
  final DtCornerStyle cornerStyle;

  DtShape copyWith({DtRadii? radius, DtBorderWidths? borderWidth, DtCornerStyle? cornerStyle}) => DtShape(
        radius: radius ?? this.radius,
        borderWidth: borderWidth ?? this.borderWidth,
        cornerStyle: cornerStyle ?? this.cornerStyle,
      );

  Map<String, Object?> toJson() => {
        'radius': radius.toJson(),
        'borderWidth': borderWidth.toJson(),
        'cornerStyle': cornerStyle.name,
      };
}
