import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/breakpoint.dart';
import '../models/color.dart';
import '../models/components.dart';
import '../models/layout.dart';
import '../models/navigation.dart';
import '../models/theme.dart';
import '../models/typography.dart';
import 'fonts.dart';
import 'page_transitions.dart';
import 'tokens_extension.dart';

/// Maps a resolved [DtTheme] to Material 3 [ThemeData] for light and dark mode.
///
/// [breakpoint] selects `typography.responsiveScale` (display and headline only).
class DtThemeBuilder {
  DtThemeBuilder(this.theme, {this.breakpoint = Breakpoint.tablet, DtFontResolver? fonts})
      : fonts = fonts ?? DtFonts.resolver;

  final DtTheme theme;
  final Breakpoint breakpoint;
  final DtFontResolver fonts;

  /// Material elevation (dp) used for schema elevation levels 0–5.
  static const List<double> elevationDp = [0, 1, 3, 6, 8, 12];

  static double dpForLevel(int level) => elevationDp[level.clamp(0, elevationDp.length - 1)];

  ThemeData get light => build(Brightness.light);
  ThemeData get dark => build(Brightness.dark);

  // ── Color ────────────────────────────────────────────────────────────────

  ColorScheme colorScheme(Brightness brightness) {
    final c = theme.color.of(brightness);
    final other = theme.color.of(brightness == Brightness.light ? Brightness.dark : Brightness.light);
    return ColorScheme(
      brightness: brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: c.primaryContainer,
      onPrimaryContainer: c.onPrimaryContainer,
      secondary: c.secondary,
      onSecondary: c.onSecondary,
      secondaryContainer: c.secondaryContainer,
      onSecondaryContainer: c.onSecondaryContainer,
      tertiary: c.accent,
      onTertiary: c.onAccent,
      tertiaryContainer: c.accentContainer,
      onTertiaryContainer: c.onAccentContainer,
      error: c.error,
      onError: c.onError,
      errorContainer: c.errorContainer,
      onErrorContainer: c.onErrorContainer,
      surface: c.surface,
      onSurface: c.onSurface,
      onSurfaceVariant: c.onSurfaceMuted,
      // The schema has three container levels; Material has five.
      surfaceContainerLowest: brightness == Brightness.light ? c.surface : c.background,
      surfaceContainerLow: c.surfaceContainerLow,
      surfaceContainer: c.surfaceContainer,
      surfaceContainerHigh: c.surfaceContainerHigh,
      surfaceContainerHighest: c.surfaceContainerHigh,
      outline: c.outline,
      outlineVariant: c.outlineMuted,
      scrim: c.scrim,
      shadow: theme.elevation.shadowColor(brightness),
      inverseSurface: c.onSurface,
      onInverseSurface: c.surface,
      inversePrimary: other.primary,
      surfaceTint: c.primary,
    );
  }

  // ── Typography ───────────────────────────────────────────────────────────

  TextStyle textStyle(DtTextStyle s, {Color? color}) => fonts(
        s.family,
        TextStyle(
          fontSize: s.size,
          fontWeight: _weight(s.weight),
          height: s.heightFactor,
          letterSpacing: s.letterSpacing,
          leadingDistribution: TextLeadingDistribution.even,
          color: color,
        ),
      );

  static FontWeight _weight(int w) => FontWeight.values[((w ~/ 100) - 1).clamp(0, 8)];

  /// Ten schema styles → fifteen Material roles. Large/small display and headline variants are
  /// derived with Material 3's size ratios; `titleSmall` reuses `labelLarge`; `caption` → `labelSmall`.
  TextTheme textTheme(Brightness brightness) {
    final s = theme.typography.styles;
    final on = theme.color.of(brightness).onSurface;
    final scale = theme.typography.responsiveScale.of(breakpoint);
    final display = s.display.scaled(scale);
    final headline = s.headline.scaled(scale);
    TextStyle t(DtTextStyle style) => textStyle(style, color: on);
    return TextTheme(
      displayLarge: t(display.scaled(57 / 45)),
      displayMedium: t(display),
      displaySmall: t(display.scaled(36 / 45)),
      headlineLarge: t(headline.scaled(32 / 28)),
      headlineMedium: t(headline),
      headlineSmall: t(headline.scaled(24 / 28)),
      titleLarge: t(s.titleLarge),
      titleMedium: t(s.titleMedium),
      titleSmall: t(s.labelLarge),
      bodyLarge: t(s.bodyLarge),
      bodyMedium: t(s.bodyMedium),
      bodySmall: t(s.bodySmall),
      labelLarge: t(s.labelLarge),
      labelMedium: t(s.labelMedium),
      labelSmall: t(s.caption),
    );
  }

  // ── Shape ────────────────────────────────────────────────────────────────

  /// Rounded or cut ([BeveledRectangleBorder]) corners per `shape.cornerStyle`.
  OutlinedBorder shapeFor(double radius, {BorderSide side = BorderSide.none}) {
    final r = BorderRadius.circular(radius);
    return theme.shape.cornerStyle == DtCornerStyle.cut
        ? BeveledRectangleBorder(borderRadius: r, side: side)
        : RoundedRectangleBorder(borderRadius: r, side: side);
  }

  OutlinedBorder get _pill =>
      theme.shape.cornerStyle == DtCornerStyle.cut ? shapeFor(theme.shape.radius.full) : const StadiumBorder();

  // ── ThemeData ────────────────────────────────────────────────────────────

  ThemeData build(Brightness brightness) {
    final cs = colorScheme(brightness);
    final c = theme.color.of(brightness);
    final tt = textTheme(brightness);
    final comp = theme.components;
    final bw = theme.shape.borderWidth;
    final nav = theme.navigation;

    final btn = comp.button;
    final btnShape = shapeFor(btn.radius);
    final btnMin = Size(btn.height, btn.height);
    final btnPad = EdgeInsets.symmetric(horizontal: btn.paddingX);

    final indicatorColor = nav.indicator == DtNavIndicator.none ? Colors.transparent : cs.secondaryContainer;
    final ShapeBorder indicatorShape = switch (nav.indicator) {
      DtNavIndicator.underline => DtUnderlineIndicatorBorder(thickness: math.max(3, bw.thick)),
      _ => _pill,
    };

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: cs,
      textTheme: tt,
      visualDensity: VisualDensity.standard,
      scaffoldBackgroundColor: c.background,
      canvasColor: c.background,
      disabledColor: c.onSurfaceDisabled,
      dividerColor: c.outlineMuted,
      focusColor: c.focusRing.withValues(alpha: theme.effects.opacity.pressed),
      hoverColor: c.onSurface.withValues(alpha: theme.effects.opacity.hover),
      pageTransitionsTheme: PageTransitionsTheme(builders: {
        for (final p in TargetPlatform.values) p: DtPageTransitionsBuilder(theme.motion),
      }),
      extensions: [DtTokens.fromTheme(theme, brightness)],
      dividerTheme: DividerThemeData(color: c.outlineMuted, thickness: bw.thin, space: bw.thin),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(shape: btnShape, minimumSize: btnMin, padding: btnPad, textStyle: tt.labelLarge),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(shape: btnShape, minimumSize: btnMin, padding: btnPad, textStyle: tt.labelLarge),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: btnShape,
          minimumSize: btnMin,
          padding: btnPad,
          textStyle: tt.labelLarge,
          side: BorderSide(color: cs.outline, width: bw.thin),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          shape: btnShape,
          minimumSize: btnMin,
          padding: EdgeInsets.symmetric(horizontal: btn.paddingX / 2),
          textStyle: tt.labelLarge,
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(shape: shapeFor(theme.shape.radius.lg)),
      inputDecorationTheme: _inputTheme(cs, c, tt),
      cardTheme: CardThemeData(
        shape: shapeFor(
          comp.card.radius,
          side: comp.card.bordered ? BorderSide(color: c.outlineMuted, width: bw.thin) : BorderSide.none,
        ),
        elevation: dpForLevel(comp.card.elevation),
        shadowColor: cs.shadow,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
      ),
      dialogTheme: DialogThemeData(
        shape: shapeFor(comp.dialog.radius),
        elevation: dpForLevel(comp.dialog.elevation),
        backgroundColor: c.surfaceContainerHigh,
        shadowColor: cs.shadow,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: tt.headlineSmall,
        contentTextStyle: tt.bodyMedium?.copyWith(color: c.onSurfaceMuted),
      ),
      chipTheme: ChipThemeData(
        shape: shapeFor(comp.chip.radius),
        side: BorderSide(color: c.outlineMuted, width: bw.thin),
        labelStyle: tt.labelLarge,
      ),
      badgeTheme: BadgeThemeData(backgroundColor: c.error, textColor: c.onError, textStyle: tt.labelSmall),
      appBarTheme: AppBarThemeData(
        centerTitle: nav.appBar.centeredTitle,
        toolbarHeight: nav.appBar.height,
        elevation: nav.appBar.elevated ? dpForLevel(2) : 0,
        scrolledUnderElevation: nav.appBar.elevated ? dpForLevel(2) : 0,
        backgroundColor: c.surface,
        foregroundColor: c.onSurface,
        surfaceTintColor: Colors.transparent,
        shadowColor: cs.shadow,
        titleTextStyle: tt.titleLarge,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: c.surfaceContainer,
        indicatorColor: indicatorColor,
        indicatorShape: indicatorShape,
        labelTextStyle: WidgetStatePropertyAll(tt.labelMedium),
        labelBehavior: switch (nav.showLabels) {
          DtShowLabels.always => NavigationDestinationLabelBehavior.alwaysShow,
          DtShowLabels.selected => NavigationDestinationLabelBehavior.onlyShowSelected,
          DtShowLabels.never => NavigationDestinationLabelBehavior.alwaysHide,
        },
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: c.surface,
        useIndicator: nav.indicator != DtNavIndicator.none,
        indicatorColor: indicatorColor,
        indicatorShape: indicatorShape,
        selectedLabelTextStyle: tt.labelMedium?.copyWith(color: c.onSurface),
        unselectedLabelTextStyle: tt.labelMedium?.copyWith(color: c.onSurfaceMuted),
        labelType: switch (nav.showLabels) {
          DtShowLabels.always => NavigationRailLabelType.all,
          DtShowLabels.selected => NavigationRailLabelType.selected,
          DtShowLabels.never => NavigationRailLabelType.none,
        },
      ),
      navigationDrawerTheme: NavigationDrawerThemeData(
        backgroundColor: c.surfaceContainerLow,
        indicatorColor: indicatorColor,
        indicatorShape: indicatorShape,
        labelTextStyle: WidgetStatePropertyAll(tt.labelLarge),
      ),
      drawerTheme: DrawerThemeData(backgroundColor: c.surfaceContainerLow, scrimColor: c.scrim),
      tabBarTheme: _tabBarTheme(cs, c, tt),
      listTileTheme: ListTileThemeData(
        shape: shapeFor(theme.shape.radius.sm),
        iconColor: c.onSurfaceMuted,
        subtitleTextStyle: tt.bodyMedium?.copyWith(color: c.onSurfaceMuted),
      ),
      snackBarTheme: SnackBarThemeData(
        shape: shapeFor(theme.shape.radius.xs),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  InputDecorationThemeData _inputTheme(ColorScheme cs, DtColorScheme c, TextTheme tt) {
    final input = theme.components.input;
    final bw = theme.shape.borderWidth;
    final filled = input.variant == DtInputVariant.filled;
    // Flutter's InputBorders are rounded only; `cut` corners do not apply to text fields.
    InputBorder border(Color color, double width) => filled
        ? UnderlineInputBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(input.radius)),
            borderSide: BorderSide(color: color, width: width),
          )
        : OutlineInputBorder(
            borderRadius: BorderRadius.circular(input.radius),
            borderSide: BorderSide(color: color, width: width),
          );
    final lineHeight = theme.typography.styles.bodyLarge.lineHeight;
    return InputDecorationThemeData(
      filled: filled,
      fillColor: c.surfaceContainerHigh,
      contentPadding: EdgeInsets.symmetric(
        horizontal: theme.spacing.scale.lg,
        vertical: math.max(4, (input.height - lineHeight) / 2),
      ),
      border: border(c.outline, bw.thin),
      enabledBorder: border(filled ? c.onSurfaceMuted : c.outline, bw.thin),
      focusedBorder: border(c.primary, bw.thick),
      errorBorder: border(c.error, bw.thin),
      focusedErrorBorder: border(c.error, bw.thick),
      disabledBorder: border(c.onSurfaceDisabled, bw.thin),
      labelStyle: tt.bodyLarge?.copyWith(color: c.onSurfaceMuted),
      floatingLabelStyle: tt.bodySmall?.copyWith(color: c.primary),
      hintStyle: tt.bodyLarge?.copyWith(color: c.onSurfaceMuted),
      helperStyle: tt.bodySmall?.copyWith(color: c.onSurfaceMuted),
      errorStyle: tt.bodySmall?.copyWith(color: c.error),
    );
  }

  TabBarThemeData _tabBarTheme(ColorScheme cs, DtColorScheme c, TextTheme tt) {
    final nav = theme.navigation;
    return switch (nav.indicator) {
      DtNavIndicator.pill => TabBarThemeData(
          indicator: ShapeDecoration(shape: _pill, color: c.secondaryContainer),
          indicatorSize: TabBarIndicatorSize.tab,
          labelColor: c.onSecondaryContainer,
          unselectedLabelColor: c.onSurfaceMuted,
          labelStyle: tt.titleSmall,
          unselectedLabelStyle: tt.titleSmall,
          dividerColor: c.outlineMuted,
        ),
      DtNavIndicator.underline => TabBarThemeData(
          indicator: UnderlineTabIndicator(
            borderSide: BorderSide(color: c.primary, width: math.max(3, theme.shape.borderWidth.thick)),
          ),
          indicatorSize: TabBarIndicatorSize.label,
          labelColor: c.primary,
          unselectedLabelColor: c.onSurfaceMuted,
          labelStyle: tt.titleSmall,
          unselectedLabelStyle: tt.titleSmall,
          dividerColor: c.outlineMuted,
        ),
      DtNavIndicator.none => TabBarThemeData(
          indicator: const BoxDecoration(),
          labelColor: c.primary,
          unselectedLabelColor: c.onSurfaceMuted,
          labelStyle: tt.titleSmall,
          unselectedLabelStyle: tt.titleSmall,
          dividerColor: c.outlineMuted,
        ),
    };
  }
}

/// Navigation indicator drawn as a short bar along the bottom edge of the indicator area.
class DtUnderlineIndicatorBorder extends ShapeBorder {
  const DtUnderlineIndicatorBorder({this.thickness = 3, this.inset = 12});

  final double thickness;

  /// Horizontal inset from each side of the indicator area.
  final double inset;

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.zero;

  Path _path(Rect rect) {
    final width = math.max(0.0, rect.width - inset * 2);
    final bar = Rect.fromLTWH(rect.center.dx - width / 2, rect.bottom - thickness, width, thickness);
    return Path()..addRRect(RRect.fromRectAndRadius(bar, Radius.circular(thickness / 2)));
  }

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => _path(rect);

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) => _path(rect);

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {}

  @override
  ShapeBorder scale(double t) => DtUnderlineIndicatorBorder(thickness: thickness * t, inset: inset * t);

  @override
  bool operator ==(Object other) =>
      other is DtUnderlineIndicatorBorder && other.thickness == thickness && other.inset == inset;

  @override
  int get hashCode => Object.hash(thickness, inset);
}
