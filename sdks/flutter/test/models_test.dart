import 'dart:ui';

import 'package:theme_studio/theme_studio.dart';
import 'package:flutter/animation.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers.dart';

void main() {
  group('fixtures', () {
    for (final name in fixtureNames) {
      test('$name parses and round-trips to identical JSON', () {
        final json = fixtureJson(name);
        final theme = DtTheme.fromJson(json);
        expect(theme.schemaVersion, 1);
        expect(theme.meta, isNotNull);
        expect(theme.toJson(), equals(json));
      });
    }

    test('bundled default matches the default fixture', () {
      expect(DtTheme.fallback.toJson(), equals(fixtureJson('default')));
    });
  });

  group('acme values', () {
    final acme = fixture('acme');

    test('colors', () {
      expect(acme.color.light.primary, const Color(0xFF1D4ED8));
      expect(acme.color.dark.primary, const Color(0xFFB7C4FF));
      // #RRGGBBAA → alpha last.
      expect(acme.color.light.scrim, const Color(0x52000000));
      expect(acme.color.of(Brightness.dark), same(acme.color.dark));
    });

    test('spacing maps 2xl/3xl to xxl/xxxl', () {
      expect(acme.spacing.scale.xxl, 32);
      expect(acme.spacing.scale.xxxl, 48);
      expect(acme.spacing.layout.mobile.contentMaxWidth, isNull);
      expect(acme.spacing.layout[Breakpoint.desktop].contentMaxWidth, 1200);
    });

    test('motion', () {
      expect(acme.motion.pageTransition, DtPageTransition.slide);
      expect(acme.motion.duration.medium, const Duration(milliseconds: 250));
      expect(acme.motion.easing.standard, isA<Cubic>());
      expect(acme.motion.easing.standard.a, 0.2);
      expect(acme.motion.easing.accelerate.c, 1);
    });

    test('navigation, components, typography', () {
      expect(acme.navigation.pattern.tablet, DtNavPattern.rail);
      expect(acme.navigation.indicator, DtNavIndicator.underline);
      expect(acme.components.button.variant, DtButtonVariant.filled);
      expect(acme.typography.styles.display.family, 'Poppins');
      expect(acme.typography.styles.display.heightFactor, closeTo(52 / 45, 1e-9));
      expect(acme.assets.appName, 'Acme Fleet');
      expect(acme.elevation.levels, hasLength(6));
    });
  });

  test('breakpoints', () {
    final bps = fixture('default').sizing.breakpoints;
    expect(bps.forWidth(0), Breakpoint.mobile);
    expect(bps.forWidth(599.9), Breakpoint.mobile);
    expect(bps.forWidth(600), Breakpoint.tablet);
    expect(bps.forWidth(1024), Breakpoint.desktop);
    expect(bps.forWidth(1440), Breakpoint.wide);
  });

  group('errors', () {
    test('newer schemaVersion throws a clear error', () {
      final json = fixtureJson('acme')..['schemaVersion'] = 2;
      expect(
        () => DtTheme.fromJson(json),
        throwsA(isA<DtUnsupportedSchemaVersionException>()
            .having((e) => e.toString(), 'message', contains('supports up to 1'))),
      );
    });

    test('missing schemaVersion is a format error', () {
      final json = fixtureJson('acme')..remove('schemaVersion');
      expect(() => DtTheme.fromJson(json), throwsA(isA<DtThemeFormatException>()));
    });

    test('bad values report their path', () {
      final json = fixtureJson('acme');
      (json['color']['light'] as Map)['primary'] = 'blue';
      expect(
        () => DtTheme.fromJson(json),
        throwsA(isA<DtThemeFormatException>().having((e) => e.path, 'path', 'color.light.primary')),
      );
      final json2 = fixtureJson('acme');
      (json2['navigation'] as Map)['indicator'] = 'glow';
      expect(
        () => DtTheme.fromJson(json2),
        throwsA(isA<DtThemeFormatException>().having((e) => e.path, 'path', 'navigation.indicator')),
      );
    });

    test('invalid JSON', () {
      expect(() => DtTheme.fromJsonString('{nope'), throwsA(isA<DtThemeFormatException>()));
    });
  });

  group('text style italic', () {
    test('fixtures carry italic: false', () {
      final s = fixture('acme').typography.styles;
      expect(s.display.italic, isFalse);
      expect(s.caption.italic, isFalse);
    });

    test('missing italic defaults to false (older servers / caches)', () {
      final json = fixtureJson('acme');
      final styles = (json['typography'] as Map)['styles'] as Map;
      for (final style in styles.values) {
        (style as Map).remove('italic');
      }
      final t = DtTheme.fromJson(json);
      expect(t.typography.styles.bodyLarge.italic, isFalse);
      expect(t.typography.styles.display.italic, isFalse);
    });

    test('italic: true parses and round-trips through toJson', () {
      final json = fixtureJson('acme');
      ((json['typography'] as Map)['styles'] as Map)['headline']['italic'] = true;
      final t = DtTheme.fromJson(json);
      expect(t.typography.styles.headline.italic, isTrue);
      expect(t.typography.styles.bodyLarge.italic, isFalse);
      final out = t.toJson();
      expect(((out['typography'] as Map)['styles'] as Map)['headline']['italic'], isTrue);
      expect(((out['typography'] as Map)['styles'] as Map)['bodyLarge']['italic'], isFalse);
      expect(out, equals(json));
    });

    test('non-boolean italic is a format error', () {
      final json = fixtureJson('acme');
      ((json['typography'] as Map)['styles'] as Map)['caption']['italic'] = 'yes';
      expect(
        () => DtTheme.fromJson(json),
        throwsA(isA<DtThemeFormatException>().having((e) => e.path, 'path', 'typography.styles.caption.italic')),
      );
    });

    test('copyWith and scaled keep italic', () {
      final s = fixture('acme').typography.styles.display;
      expect(s.copyWith(italic: true).italic, isTrue);
      expect(s.copyWith(italic: true).scaled(2).italic, isTrue);
      expect(s.copyWith(size: 10).italic, isFalse);
    });
  });

  test('hex helpers', () {
    expect(parseHexColor('#1d4ed8'), const Color(0xFF1D4ED8));
    expect(parseHexColor('#1D4ED880'), const Color(0x801D4ED8));
    expect(parseHexColor('1D4ED8'), isNull);
    expect(toHexColor(const Color(0x801D4ED8)), '#1D4ED880');
    expect(toHexColor(const Color(0xFF1D4ED8)), '#1D4ED8');
  });

  test('text transform', () {
    expect(DtTextTransform.uppercase.apply('save draft'), 'SAVE DRAFT');
    expect(DtTextTransform.capitalize.apply('save my draft'), 'Save My Draft');
    expect(DtTextTransform.none.apply('save'), 'save');
  });

  test('gradient resolves color roles per mode', () {
    final t = fixture('acme');
    expect(t.effects.gradient.resolve(t.color.light), isNull); // disabled in fixture
    final g = DtGradientTokens(enabled: true, angle: 90, stops: const ['primary', 'accent']);
    final lg = g.resolve(t.color.dark)!;
    expect(lg.colors, [t.color.dark.primary, t.color.dark.accent]);
    expect(lg.end.resolve(TextDirection.ltr).x, closeTo(1, 1e-9));
  });
}
