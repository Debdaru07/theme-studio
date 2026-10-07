import 'package:theme_studio/theme_studio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers.dart';

void main() {
  for (final name in fixtureNames) {
    test('$name builds light and dark ThemeData', () {
      final b = DtThemeBuilder(fixture(name));
      for (final (data, brightness) in [(b.light, Brightness.light), (b.dark, Brightness.dark)]) {
        expect(data.useMaterial3, isTrue);
        expect(data.brightness, brightness);
        expect(data.colorScheme.brightness, brightness);
        expect(data.extension<DtTokens>()!.brightness, brightness);
      }
    });
  }

  group('acme', () {
    final theme = fixture('acme');
    final b = DtThemeBuilder(theme);
    final light = b.light, dark = b.dark;

    test('ColorScheme mapping', () {
      final cs = light.colorScheme;
      expect(cs.primary, const Color(0xFF1D4ED8));
      expect(dark.colorScheme.primary, const Color(0xFFB7C4FF));
      expect(cs.tertiary, theme.color.light.accent);
      expect(cs.onTertiaryContainer, theme.color.light.onAccentContainer);
      expect(cs.onSurfaceVariant, theme.color.light.onSurfaceMuted);
      expect(cs.outlineVariant, theme.color.light.outlineMuted);
      expect(cs.surfaceContainer, theme.color.light.surfaceContainer);
      expect(cs.scrim, const Color(0x52000000));
      expect(cs.inversePrimary, dark.colorScheme.primary);
      expect(light.scaffoldBackgroundColor, theme.color.light.background);
      expect(dark.scaffoldBackgroundColor, theme.color.dark.background);
    });

    test('TextTheme mapping', () {
      final tt = light.textTheme;
      expect(tt.displayMedium!.fontSize, 45);
      expect(tt.displayMedium!.height, closeTo(52 / 45, 1e-9));
      expect(tt.displayMedium!.fontFamily, 'Poppins');
      expect(tt.displayLarge!.fontSize, closeTo(57, 1e-9));
      expect(tt.headlineMedium!.fontSize, 28);
      expect(tt.headlineMedium!.fontWeight, FontWeight.w600);
      expect(tt.titleSmall!.fontSize, theme.typography.styles.labelLarge.size);
      expect(tt.bodyMedium!.fontFamily, 'Roboto');
      expect(tt.bodyMedium!.letterSpacing, 0.25);
      expect(tt.labelSmall!.fontSize, 11); // caption
      expect(tt.bodyLarge!.color, theme.color.light.onSurface);
    });

    test('responsive scale applies to display and headline only', () {
      final mobile = DtThemeBuilder(theme, breakpoint: Breakpoint.mobile).textTheme(Brightness.light);
      final wide = DtThemeBuilder(theme, breakpoint: Breakpoint.wide).textTheme(Brightness.light);
      expect(mobile.displayMedium!.fontSize, closeTo(40.5, 1e-9));
      expect(wide.headlineMedium!.fontSize, closeTo(30.8, 1e-9));
      expect(mobile.displayMedium!.height, closeTo(52 / 45, 1e-9));
      expect(mobile.bodyLarge!.fontSize, 16);
      expect(wide.titleLarge!.fontSize, 22);
    });

    test('rounded corners and button tokens', () {
      final shape = light.filledButtonTheme.style!.shape!.resolve({})!;
      expect(shape, isA<RoundedRectangleBorder>());
      expect(light.filledButtonTheme.style!.minimumSize!.resolve({})!.height, 40);
      expect(light.filledButtonTheme.style!.padding!.resolve({}), const EdgeInsets.symmetric(horizontal: 24));
      expect(light.cardTheme.shape, isA<RoundedRectangleBorder>());
      expect((light.cardTheme.shape! as RoundedRectangleBorder).borderRadius, BorderRadius.circular(8));
      expect(light.cardTheme.elevation, DtThemeBuilder.dpForLevel(1));
      expect(light.inputDecorationTheme.filled, isFalse);
      expect(light.inputDecorationTheme.enabledBorder, isA<OutlineInputBorder>());
    });

    test('navigation themes', () {
      expect(light.navigationBarTheme.labelBehavior, NavigationDestinationLabelBehavior.alwaysShow);
      expect(light.navigationBarTheme.indicatorShape, isA<DtUnderlineIndicatorBorder>());
      expect(light.navigationRailTheme.labelType, NavigationRailLabelType.all);
      expect(light.tabBarTheme.indicator, isA<UnderlineTabIndicator>());
      expect(light.appBarTheme.toolbarHeight, 64);
      expect(light.appBarTheme.centerTitle, isFalse);
    });

    test('page transitions use slide for every platform', () {
      for (final p in TargetPlatform.values) {
        final builder = light.pageTransitionsTheme.builders[p];
        expect(builder, isA<DtPageTransitionsBuilder>());
        expect((builder! as DtPageTransitionsBuilder).motion.pageTransition, DtPageTransition.slide);
        expect(builder.transitionDuration, const Duration(milliseconds: 250));
      }
    });

    test('DtTokens extension', () {
      final t = light.extension<DtTokens>()!;
      expect(t.colors.success, theme.color.light.success);
      expect(dark.extension<DtTokens>()!.colors.success, theme.color.dark.success);
      expect(t.spacing.md, 12);
      expect(t.layout.desktop.contentMaxWidth, 1200);
      expect(t.shadow(0), isEmpty);
      expect(t.shadow(3).single.blurRadius, 12);
      expect(t.shadow(3).single.color.a, closeTo(0.16, 1e-3));
      expect(t.breakpointFor(700), Breakpoint.tablet);
    });

    test('DtTokens copyWith and lerp', () {
      final a = light.extension<DtTokens>()!;
      final z = DtThemeBuilder(fixture('globex')).light.extension<DtTokens>()!;
      expect(a.copyWith(spacing: z.spacing).spacing, same(z.spacing));
      final mid = a.lerp(z, 0.5);
      expect(mid.colors.primary, Color.lerp(a.colors.primary, z.colors.primary, 0.5));
      expect(mid.shape.radius.md, (a.shape.radius.md + z.shape.radius.md) / 2);
      expect(a.lerp(z, 0.2).navigation, same(a.navigation));
      expect(a.lerp(z, 0.8).navigation, same(z.navigation));
      // ThemeData.lerp goes through the extension.
      final lerped = ThemeData.lerp(light, DtThemeBuilder(fixture('globex')).light, 0.5);
      expect(lerped.extension<DtTokens>(), isNotNull);
    });
  });

  group('globex', () {
    final theme = fixture('globex');
    final light = DtThemeBuilder(theme).light;

    test('cut corners map to BeveledRectangleBorder', () {
      expect(theme.shape.cornerStyle, DtCornerStyle.cut);
      for (final style in [
        light.filledButtonTheme.style!,
        light.outlinedButtonTheme.style!,
        light.elevatedButtonTheme.style!,
        light.textButtonTheme.style!,
      ]) {
        expect(style.shape!.resolve({}), isA<BeveledRectangleBorder>());
      }
      expect(light.cardTheme.shape, isA<BeveledRectangleBorder>());
      expect(light.dialogTheme.shape, isA<BeveledRectangleBorder>());
      expect(light.chipTheme.shape, isA<BeveledRectangleBorder>());
    });

    test('button variant, input variant, transitions, labels', () {
      expect(theme.components.button.variant, DtButtonVariant.outlined);
      expect(light.inputDecorationTheme.filled, isTrue);
      expect(light.inputDecorationTheme.enabledBorder, isA<UnderlineInputBorder>());
      final tb = light.pageTransitionsTheme.builders[TargetPlatform.android]! as DtPageTransitionsBuilder;
      expect(tb.motion.pageTransition, DtPageTransition.fade);
      expect(tb.transitionDuration, const Duration(milliseconds: 300));
      expect(light.navigationBarTheme.labelBehavior, NavigationDestinationLabelBehavior.onlyShowSelected);
      expect(light.navigationRailTheme.labelType, NavigationRailLabelType.selected);
      expect(light.tabBarTheme.indicator, isA<ShapeDecoration>());
      expect(light.textTheme.displayMedium!.fontFamily, 'Merriweather');
    });
  });

  test('bordered card gets an outlineMuted side', () {
    final base = fixture('acme');
    final theme = base.copyWith(
      components: DtComponents(
        button: base.components.button,
        input: base.components.input,
        card: const DtCardTokens(radius: 8, elevation: 0, bordered: true),
        dialog: base.components.dialog,
        chip: base.components.chip,
        badge: base.components.badge,
      ),
    );
    final shape = DtThemeBuilder(theme).light.cardTheme.shape! as RoundedRectangleBorder;
    expect(shape.side.color, base.color.light.outlineMuted);
    expect(DtThemeBuilder(theme).light.cardTheme.elevation, 0);
  });

  group('italic', () {
    DtTheme withItalic(bool? italic) {
      final json = fixtureJson('acme');
      for (final style in (((json['typography'] as Map)['styles'] as Map).values)) {
        if (italic == null) {
          (style as Map).remove('italic');
        } else {
          (style as Map)['italic'] = italic;
        }
      }
      return DtTheme.fromJson(json);
    }

    List<TextStyle> slots(TextTheme tt) => [
          tt.displayLarge!, tt.displayMedium!, tt.displaySmall!,
          tt.headlineLarge!, tt.headlineMedium!, tt.headlineSmall!,
          tt.titleLarge!, tt.titleMedium!, tt.titleSmall!,
          tt.bodyLarge!, tt.bodyMedium!, tt.bodySmall!,
          tt.labelLarge!, tt.labelMedium!, tt.labelSmall!,
        ];

    test('italic: true maps to FontStyle.italic on every TextTheme slot', () {
      final tt = DtThemeBuilder(withItalic(true)).light.textTheme;
      for (final s in slots(tt)) {
        expect(s.fontStyle, FontStyle.italic);
      }
    });

    test('italic: false and missing italic map to FontStyle.normal', () {
      for (final italic in [false, null]) {
        final tt = DtThemeBuilder(withItalic(italic)).light.textTheme;
        for (final s in slots(tt)) {
          expect(s.fontStyle, FontStyle.normal);
        }
      }
    });

    test('only the italic style is italic', () {
      final json = fixtureJson('acme');
      ((json['typography'] as Map)['styles'] as Map)['caption']['italic'] = true;
      final tt = DtThemeBuilder(DtTheme.fromJson(json)).light.textTheme;
      expect(tt.labelSmall!.fontStyle, FontStyle.italic);
      expect(tt.labelMedium!.fontStyle, FontStyle.normal);
    });

    test('font resolvers keep fontStyle', () {
      const base = TextStyle(fontSize: 14, fontStyle: FontStyle.italic, fontWeight: FontWeight.w700);
      expect(DtFonts.system('Poppins', base).fontStyle, FontStyle.italic);
      expect(DtFonts.google('Definitely Not A Font', base).fontStyle, FontStyle.italic);
      final custom = DtThemeBuilder(withItalic(true), fonts: DtFonts.system).light.textTheme;
      expect(custom.bodyMedium!.fontStyle, FontStyle.italic);
    });
  });

  test('unknown font family falls back gracefully with the google resolver', () {
    final style = DtFonts.google('Definitely Not A Font', const TextStyle(fontSize: 14));
    expect(style.fontFamily, 'Definitely Not A Font');
    expect(style.fontSize, 14);
  });
}
