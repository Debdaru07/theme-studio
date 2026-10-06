import 'package:flutter/material.dart';

import '../models/breakpoint.dart';
import '../models/color.dart';
import '../models/components.dart';
import '../models/effects.dart';
import '../models/elevation.dart';
import '../models/layout.dart';
import '../models/motion.dart';
import '../models/navigation.dart';
import '../models/theme.dart';
import '../models/typography.dart';

/// Theme tokens Material's [ThemeData] has no slot for, resolved for one brightness.
///
/// Read it with `context.dt` (see [DtContext]) or `Theme.of(context).extension<DtTokens>()`.
@immutable
class DtTokens extends ThemeExtension<DtTokens> {
  const DtTokens({
    required this.brightness,
    required this.colors,
    required this.spacing,
    required this.layout,
    required this.componentSpacing,
    required this.sizing,
    required this.shape,
    required this.shadows,
    required this.zIndex,
    required this.motion,
    required this.navigation,
    required this.components,
    required this.effects,
    required this.gradient,
    required this.typography,
    required this.assets,
  });

  factory DtTokens.fromTheme(DtTheme theme, Brightness brightness) {
    final colors = theme.color.of(brightness);
    return DtTokens(
      brightness: brightness,
      colors: colors,
      spacing: theme.spacing.scale,
      layout: theme.spacing.layout,
      componentSpacing: theme.spacing.component,
      sizing: theme.sizing,
      shape: theme.shape,
      shadows: [
        for (var i = 0; i < DtElevation.levelCount; i++) theme.elevation.shadows(i, brightness),
      ],
      zIndex: theme.elevation.zIndex,
      motion: theme.motion,
      navigation: theme.navigation,
      components: theme.components,
      effects: theme.effects,
      gradient: theme.effects.gradient.resolve(colors),
      typography: theme.typography,
      assets: theme.assets,
    );
  }

  final Brightness brightness;

  /// Every color role for this mode, including those not in [ColorScheme]
  /// (success/warning/info families, onSurfaceDisabled, focusRing, background).
  final DtColorScheme colors;
  final DtSpacingScale spacing;
  final DtPerBreakpoint<DtLayout> layout;
  final DtComponentSpacing componentSpacing;
  final DtSizing sizing;
  final DtShape shape;

  /// Box shadows for elevation levels 0–5 in this mode.
  final List<List<BoxShadow>> shadows;
  final DtZIndex zIndex;
  final DtMotion motion;
  final DtNavigation navigation;
  final DtComponents components;
  final DtEffects effects;

  /// The brand gradient, or null when `effects.gradient.enabled` is false.
  final LinearGradient? gradient;
  final DtTypography typography;
  final DtAssets assets;

  Breakpoint breakpointFor(double width) => sizing.breakpoints.forWidth(width);

  List<BoxShadow> shadow(int level) => shadows[level.clamp(0, shadows.length - 1)];

  String? get logo => assets.logo(brightness);

  @override
  DtTokens copyWith({
    Brightness? brightness,
    DtColorScheme? colors,
    DtSpacingScale? spacing,
    DtPerBreakpoint<DtLayout>? layout,
    DtComponentSpacing? componentSpacing,
    DtSizing? sizing,
    DtShape? shape,
    List<List<BoxShadow>>? shadows,
    DtZIndex? zIndex,
    DtMotion? motion,
    DtNavigation? navigation,
    DtComponents? components,
    DtEffects? effects,
    LinearGradient? gradient,
    DtTypography? typography,
    DtAssets? assets,
  }) =>
      DtTokens(
        brightness: brightness ?? this.brightness,
        colors: colors ?? this.colors,
        spacing: spacing ?? this.spacing,
        layout: layout ?? this.layout,
        componentSpacing: componentSpacing ?? this.componentSpacing,
        sizing: sizing ?? this.sizing,
        shape: shape ?? this.shape,
        shadows: shadows ?? this.shadows,
        zIndex: zIndex ?? this.zIndex,
        motion: motion ?? this.motion,
        navigation: navigation ?? this.navigation,
        components: components ?? this.components,
        effects: effects ?? this.effects,
        gradient: gradient ?? this.gradient,
        typography: typography ?? this.typography,
        assets: assets ?? this.assets,
      );

  /// Colors, spacing scale, radii, shadows and gradient interpolate; discrete tokens
  /// (patterns, variants, durations, …) switch at the midpoint.
  @override
  DtTokens lerp(covariant DtTokens? other, double t) {
    if (other == null || identical(this, other)) return this;
    final snap = t < 0.5 ? this : other;
    return DtTokens(
      brightness: snap.brightness,
      colors: DtColorScheme.lerp(colors, other.colors, t),
      spacing: DtSpacingScale.lerp(spacing, other.spacing, t),
      layout: snap.layout,
      componentSpacing: snap.componentSpacing,
      sizing: snap.sizing,
      shape: snap.shape.copyWith(radius: DtRadii.lerp(shape.radius, other.shape.radius, t)),
      shadows: [
        for (var i = 0; i < shadows.length; i++)
          BoxShadow.lerpList(shadows[i], other.shadows[i], t) ?? const <BoxShadow>[],
      ],
      zIndex: snap.zIndex,
      motion: snap.motion,
      navigation: snap.navigation,
      components: snap.components,
      effects: snap.effects,
      gradient: LinearGradient.lerp(gradient, other.gradient, t),
      typography: snap.typography,
      assets: snap.assets,
    );
  }
}

/// Tokens plus the current breakpoint, as returned by `context.dt`.
class DtContext {
  DtContext._(this.tokens, this.breakpoint, this._disableAnimations);

  /// Reads [DtTokens] from the ambient [Theme] (falling back to the bundled default theme)
  /// and the breakpoint from [MediaQuery] width.
  factory DtContext.of(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<DtTokens>() ?? _fallback(theme.brightness);
    final width = MediaQuery.maybeSizeOf(context)?.width ?? 0;
    return DtContext._(
      tokens,
      tokens.breakpointFor(width),
      MediaQuery.maybeDisableAnimationsOf(context) ?? false,
    );
  }

  static DtTokens? _fallbackLight, _fallbackDark;
  static DtTokens _fallback(Brightness b) => b == Brightness.dark
      ? (_fallbackDark ??= DtTokens.fromTheme(DtTheme.fallback, b))
      : (_fallbackLight ??= DtTokens.fromTheme(DtTheme.fallback, b));

  final DtTokens tokens;
  final Breakpoint breakpoint;
  final bool _disableAnimations;

  DtColorScheme get colors => tokens.colors;
  DtSpacingScale get spacing => tokens.spacing;

  /// Layout values for the current [breakpoint].
  DtLayout get layout => tokens.layout.of(breakpoint);
  DtComponentSpacing get componentSpacing => tokens.componentSpacing;
  DtSizing get sizing => tokens.sizing;
  DtShape get shape => tokens.shape;
  DtZIndex get zIndex => tokens.zIndex;
  DtMotion get motion => tokens.motion;
  DtNavigation get navigation => tokens.navigation;

  /// Navigation pattern for the current [breakpoint].
  DtNavPattern get navPattern => tokens.navigation.pattern.of(breakpoint);
  DtComponents get components => tokens.components;
  DtEffects get effects => tokens.effects;
  LinearGradient? get gradient => tokens.gradient;
  DtTypography get typography => tokens.typography;
  DtAssets get assets => tokens.assets;
  String? get logo => tokens.logo;

  List<BoxShadow> shadow(int level) => tokens.shadow(level);

  /// True when animations should be skipped (`respectReducedMotion` and the OS asks for it).
  bool get reduceMotion => tokens.motion.respectReducedMotion && _disableAnimations;

  /// [duration], or zero when [reduceMotion].
  Duration animationDuration(Duration duration) => reduceMotion ? Duration.zero : duration;
}

extension DtBuildContextX on BuildContext {
  /// Theme tokens for this context: `context.dt.spacing.md`, `context.dt.colors.success`,
  /// `context.dt.breakpoint`, `context.dt.layout.pagePadding`.
  DtContext get dt => DtContext.of(this);
}
