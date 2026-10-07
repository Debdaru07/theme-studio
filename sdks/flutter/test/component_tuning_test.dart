import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:theme_studio/theme_studio.dart';

import 'helpers.dart';

/// The default fixture with non-default component tuning (what an agency sets in Theme Studio).
Map<String, dynamic> tunedJson() {
  final json = fixtureJson('default');
  final c = json['components'] as Map<String, dynamic>;
  final button = c['button'] as Map<String, dynamic>;
  (button['sizes'] as Map)['lg'] = {'height': 56, 'paddingX': 40, 'textStyle': 'titleMedium'};
  final variants = button['variants'] as Map;
  (variants['tonal'] as Map)
    ..['container'] = 'accentContainer'
    ..['content'] = 'onAccentContainer';
  (variants['filled'] as Map)['elevation'] = 2;
  (variants['outlined'] as Map)['border'] = 'primary';
  button['borderWidth'] = 2;
  button['iconGap'] = 12;
  (c['input'] as Map)
    ..['paddingX'] = 20
    ..['borderWidth'] = 2
    ..['labelGap'] = 10;
  (c['card'] as Map)
    ..['padding'] = 24
    ..['gap'] = 12;
  (c['dialog'] as Map)
    ..['padding'] = 32
    ..['actionGap'] = 12;
  (c['chip'] as Map)
    ..['height'] = 36
    ..['paddingX'] = 16
    ..['iconGap'] = 6
    ..['selected'] = {'container': 'primaryContainer', 'content': 'onPrimaryContainer'};
  (c['badge'] as Map)['paddingX'] = 8;
  return json;
}

/// The default fixture as a server from before component tuning sent it (none of the Phase 1 fields).
Map<String, dynamic> legacyJson() {
  final json = fixtureJson('default');
  final c = json['components'] as Map<String, dynamic>;
  (c['button'] as Map).removeWhere((k, _) => const ['sizes', 'variants', 'borderWidth', 'iconGap'].contains(k));
  (c['input'] as Map).removeWhere((k, _) => const ['borderWidth', 'paddingX', 'labelGap'].contains(k));
  (c['card'] as Map).removeWhere((k, _) => const ['padding', 'gap'].contains(k));
  (c['dialog'] as Map).removeWhere((k, _) => const ['padding', 'actionGap'].contains(k));
  (c['chip'] as Map).removeWhere((k, _) => const ['height', 'paddingX', 'iconGap', 'selected'].contains(k));
  (c['badge'] as Map).remove('paddingX');
  return json;
}

final tuned = DtTheme.fromJson(tunedJson());
final colors = tuned.color.light;

Future<void> pump(WidgetTester tester, Widget child, {DtTheme? theme}) async {
  await tester.pumpWidget(MaterialApp(
    theme: DtThemeBuilder(theme ?? tuned).light,
    home: Scaffold(body: Center(child: child)),
  ));
  await tester.pumpAndSettle(); // let a theme switch between pumps finish animating
}

Finder materialOf(Finder button) => find.descendant(of: button, matching: find.byType(Material)).first;

TextStyle textStyleOf(WidgetTester tester, String text) => tester.renderObject<RenderParagraph>(find.text(text)).text.style!;

void main() {
  group('role resolver', () {
    test('every color role resolves to its color, in both modes', () {
      for (final scheme in [tuned.color.light, tuned.color.dark]) {
        final map = scheme.toMap();
        expect(map.keys, DtColorScheme.roles);
        for (final role in DtColorScheme.roles) {
          expect(scheme.resolve(role), map[role], reason: role);
          expect(DtColorScheme.isRole(role), isTrue);
        }
      }
    });

    test('transparent is fully transparent', () {
      expect(colors.resolve('transparent'), Colors.transparent);
      expect(DtColorScheme.isRole('transparent'), isTrue);
    });

    test('unknown names throw in debug, naming the role', () {
      expect(DtColorScheme.isRole('brandPink'), isFalse);
      expect(
        () => colors.resolve('brandPink'),
        throwsA(isA<ArgumentError>().having((e) => e.invalidValue, 'invalidValue', 'brandPink')),
      );
    });

    test('DtTokens.color resolves for its brightness', () {
      final b = DtThemeBuilder(tuned);
      expect(b.light.extension<DtTokens>()!.color('accentContainer'), tuned.color.light.accentContainer);
      expect(b.dark.extension<DtTokens>()!.color('accentContainer'), tuned.color.dark.accentContainer);
    });
  });

  test('textStyleNamed uses the theme builder mapping', () {
    final tt = DtThemeBuilder(tuned).light.textTheme;
    final expected = {
      'display': tt.displayMedium,
      'headline': tt.headlineMedium,
      'titleLarge': tt.titleLarge,
      'titleMedium': tt.titleMedium,
      'bodyLarge': tt.bodyLarge,
      'bodyMedium': tt.bodyMedium,
      'bodySmall': tt.bodySmall,
      'labelLarge': tt.labelLarge,
      'labelMedium': tt.labelMedium,
      'caption': tt.labelSmall,
    };
    for (final e in expected.entries) {
      expect(DtThemeBuilder.textStyleNamed(tt, e.key), same(e.value), reason: e.key);
    }
  });

  group('DtButton from tokens', () {
    testWidgets('lg size: height, padding and text style', (tester) async {
      await pump(tester, DtButton(label: 'Book a slot', size: DtButtonSize.lg, onPressed: () {}));
      final material = materialOf(find.byType(FilledButton));
      expect(tester.getSize(material).height, 56);
      expect(tester.getTopLeft(find.text('Book a slot')).dx - tester.getTopLeft(material).dx, 40);
      expect(tester.getTopRight(material).dx - tester.getTopRight(find.text('Book a slot')).dx, 40);
      expect(textStyleOf(tester, 'Book a slot').fontSize, tuned.typography.styles.titleMedium.size);
    });

    testWidgets('sm and md sizes', (tester) async {
      await pump(tester, Column(mainAxisSize: MainAxisSize.min, children: [
        DtButton(label: 'Small', size: DtButtonSize.sm, onPressed: () {}),
        DtButton(label: 'Medium', onPressed: () {}),
      ]));
      final sm = materialOf(find.widgetWithText(FilledButton, 'Small'));
      final md = materialOf(find.widgetWithText(FilledButton, 'Medium'));
      expect(tester.getSize(sm).height, 32);
      expect(tester.getTopLeft(find.text('Small')).dx - tester.getTopLeft(sm).dx, 12);
      expect(textStyleOf(tester, 'Small').fontSize, tuned.typography.styles.labelMedium.size);
      expect(tester.getSize(md).height, 40);
      expect(tester.getTopLeft(find.text('Medium')).dx - tester.getTopLeft(md).dx, 24);
    });

    testWidgets('tonal variant colors come from roles', (tester) async {
      await pump(tester, DtButton(label: 'Tonal', kind: DtButtonKind.tonal, onPressed: () {}));
      final material = tester.widget<Material>(materialOf(find.byType(FilledButton)));
      expect(material.color, colors.accentContainer);
      expect(textStyleOf(tester, 'Tonal').color, colors.onAccentContainer);
      // The theme default variant still selects tonal through the old enum.
      await pump(tester, DtButton(label: 'Tonal', variant: DtButtonVariant.tonal, onPressed: () {}));
      expect(tester.widget<Material>(materialOf(find.byType(FilledButton))).color, colors.accentContainer);
    });

    testWidgets('outlined: border role and borderWidth; cut corners stay beveled', (tester) async {
      await pump(tester, DtButton(label: 'Outlined', kind: DtButtonKind.outlined, onPressed: () {}));
      final shape = tester.widget<Material>(materialOf(find.byType(OutlinedButton))).shape! as OutlinedBorder;
      expect(shape, isA<RoundedRectangleBorder>());
      expect(shape.side.width, 2);
      expect(shape.side.color, colors.primary);

      await pump(tester, DtButton(label: 'Cut', kind: DtButtonKind.outlined, onPressed: () {}), theme: fixture('globex'));
      expect(tester.widget<Material>(materialOf(find.byType(OutlinedButton))).shape, isA<BeveledRectangleBorder>());
    });

    testWidgets('filled elevation level maps to Material elevation', (tester) async {
      await pump(tester, DtButton(label: 'Raised', kind: DtButtonKind.filled, onPressed: () {}));
      expect(tester.widget<Material>(materialOf(find.byType(FilledButton))).elevation, DtThemeBuilder.dpForLevel(2));
    });

    testWidgets('text and danger variants', (tester) async {
      await pump(tester, Column(mainAxisSize: MainAxisSize.min, children: [
        DtButton(label: 'Later', kind: DtButtonKind.text, onPressed: () {}),
        DtButton(label: 'Delete', danger: true, onPressed: () {}),
      ]));
      final text = tester.widget<Material>(materialOf(find.byType(TextButton)));
      expect(text.color, Colors.transparent);
      expect(textStyleOf(tester, 'Later').color, colors.primary);
      final textShape = text.shape! as OutlinedBorder;
      expect(textShape.side, BorderSide.none);
      expect(tester.widget<Material>(materialOf(find.byType(FilledButton))).color, colors.error);
      expect(textStyleOf(tester, 'Delete').color, colors.onError);
    });

    testWidgets('iconGap separates icon and label', (tester) async {
      await pump(tester, DtButton(label: 'Add', icon: const Icon(Icons.add), onPressed: () {}));
      expect(tester.getTopLeft(find.text('Add')).dx - tester.getTopRight(find.byIcon(Icons.add)).dx, 12);
      final icon = tester.widget<RichText>(find.descendant(of: find.byIcon(Icons.add), matching: find.byType(RichText)));
      expect(icon.text.style!.color, colors.onPrimary);
    });

    testWidgets('disabled uses the theme disabled colors', (tester) async {
      await pump(tester, const DtButton(label: 'Off', onPressed: null));
      final material = tester.widget<Material>(materialOf(find.byType(FilledButton)));
      expect(material.color, colors.onSurface.withValues(alpha: 0.12));
      expect(textStyleOf(tester, 'Off').color, colors.onSurfaceDisabled);
      expect(material.elevation, 0);
    });

    testWidgets('local style wins over tokens', (tester) async {
      await pump(
        tester,
        DtButton(
          label: 'Mine',
          style: const ButtonStyle(backgroundColor: WidgetStatePropertyAll(Color(0xFF123456))),
          onPressed: () {},
        ),
      );
      expect(tester.widget<Material>(materialOf(find.byType(FilledButton))).color, const Color(0xFF123456));
    });
  });

  group('ThemeData from tokens', () {
    final data = DtThemeBuilder(tuned).light;

    test('button themes', () {
      final filled = data.filledButtonTheme.style!;
      expect(filled.minimumSize!.resolve({}), const Size(40, 40));
      expect(filled.padding!.resolve({}), const EdgeInsets.symmetric(horizontal: 24));
      final outlined = data.outlinedButtonTheme.style!;
      expect(outlined.side!.resolve({})!.width, 2);
      expect(outlined.side!.resolve({})!.color, colors.primary);
      expect(outlined.foregroundColor!.resolve({}), colors.primary);
      expect(outlined.padding!.resolve({}), const EdgeInsets.symmetric(horizontal: 24));
      final text = data.textButtonTheme.style!;
      expect(text.foregroundColor!.resolve({}), colors.primary);
      expect(text.side!.resolve({}), BorderSide.none);
      expect(text.padding!.resolve({}), const EdgeInsets.symmetric(horizontal: 12));
    });

    test('input theme', () {
      final input = data.inputDecorationTheme;
      expect((input.contentPadding! as EdgeInsets).left, 20);
      expect((input.contentPadding! as EdgeInsets).right, 20);
      expect(input.enabledBorder!.borderSide.width, 2);
      expect(input.focusedBorder!.borderSide.width, 3);
    });

    test('chip theme', () {
      final chip = data.chipTheme;
      final labelHeight = tuned.typography.styles.labelLarge.lineHeight;
      // The 1px chip border sits inside the padding: 16 - 6 - 1 and (36 - label) / 2 - 1.
      expect(chip.padding, EdgeInsets.symmetric(horizontal: 9, vertical: (36 - labelHeight) / 2 - 1));
      expect(chip.labelPadding, const EdgeInsets.symmetric(horizontal: 6));
      expect(chip.selectedColor, colors.primaryContainer);
      expect(chip.checkmarkColor, colors.onPrimaryContainer);
      final labelColor = chip.labelStyle!.color!;
      expect(WidgetStateProperty.resolveAs<Color?>(labelColor, {WidgetState.selected}), colors.onPrimaryContainer);
      expect(WidgetStateProperty.resolveAs<Color?>(labelColor, {}), colors.onSurface);
    });

    test('dialog and badge themes', () {
      expect(data.dialogTheme.actionsPadding, const EdgeInsets.fromLTRB(32, 0, 32, 32));
      expect(data.badgeTheme.padding, const EdgeInsets.symmetric(horizontal: 8));
    });
  });

  group('themed widgets from tokens', () {
    testWidgets('DtCard padding and gap', (tester) async {
      await pump(tester, const SizedBox(width: 300, child: DtCard(title: 'Route', subtitle: 'North shore')));
      final card = find.byType(Card);
      expect(tester.getTopLeft(find.text('Route')) - tester.getTopLeft(card), const Offset(24, 24));
      expect(tester.getTopLeft(find.text('North shore')).dy - tester.getBottomLeft(find.text('Route')).dy, 12);
    });

    testWidgets('DtChip height and selected colors', (tester) async {
      await pump(tester, DtChip(label: 'Today', selected: true, onSelected: (_) {}));
      final chipMaterial = find.descendant(of: find.byType(FilterChip), matching: find.byType(Material)).first;
      expect(tester.getSize(chipMaterial).height, 36);
      expect(textStyleOf(tester, 'Today').color, colors.onPrimaryContainer);

      await pump(tester, DtChip(label: 'Late', onSelected: (_) {}));
      final plain = find.descendant(of: find.byType(FilterChip), matching: find.byType(Material)).first;
      expect(tester.getTopLeft(find.text('Late')).dx - tester.getTopLeft(plain).dx, 16);
      expect(tester.getTopRight(plain).dx - tester.getTopRight(find.text('Late')).dx, 16);
      expect(textStyleOf(tester, 'Late').color, colors.onSurface);
    });

    testWidgets('DtChip below Material\'s 32px floor uses density', (tester) async {
      final json = tunedJson();
      ((json['components'] as Map)['chip'] as Map)['height'] = 28;
      await pump(tester, DtChip(label: 'Compact', onSelected: (_) {}), theme: DtTheme.fromJson(json));
      final chipMaterial = find.descendant(of: find.byType(FilterChip), matching: find.byType(Material)).first;
      expect(tester.getSize(chipMaterial).height, 28);
    });

    testWidgets('DtBadge horizontal padding', (tester) async {
      await pump(tester, const DtBadge(label: '7 alerts', count: 7, child: Icon(Icons.notifications)));
      expect(tester.widget<Badge>(find.byType(Badge)).padding, const EdgeInsets.symmetric(horizontal: 8));
      final label = find.text('7');
      final pill = find.ancestor(of: label, matching: find.byType(Container)).first;
      expect(tester.getSize(pill).width - tester.getSize(label).width, 16);
    });

    testWidgets('DtTextField label gap', (tester) async {
      await pump(tester, const SizedBox(width: 300, child: DtTextField(label: 'Email')));
      expect(tester.getTopLeft(find.byType(TextFormField)).dy - tester.getBottomLeft(find.text('Email')).dy, 10);
    });

    testWidgets('DtDialog padding and action gap', (tester) async {
      await pump(
        tester,
        DtDialog(
          title: 'Cancel delivery?',
          description: 'The driver will be notified.',
          actions: [
            DtButton(label: 'Keep', text: true, onPressed: () {}),
            DtButton(label: 'Cancel', onPressed: () {}),
          ],
        ),
      );
      final dialog = find.descendant(of: find.byType(AlertDialog), matching: find.byType(Material)).first;
      expect(tester.getTopLeft(find.text('Cancel delivery?')) - tester.getTopLeft(dialog), const Offset(32, 32));
      final keep = find.widgetWithText(TextButton, 'Keep');
      final cancel = find.widgetWithText(FilledButton, 'Cancel');
      expect(tester.getTopLeft(cancel).dx - tester.getTopRight(keep).dx, 12);
      expect(tester.getBottomRight(dialog).dx - tester.getTopRight(cancel).dx, 32);
    });
  });

  group('themes without the tuning fields', () {
    final legacy = DtTheme.fromJson(legacyJson());
    final current = fixture('default');

    test('parse to the same tokens as the current default', () {
      expect(legacy.components.toJson(), current.components.toJson());
    });

    test('build the same component themes', () {
      final a = DtThemeBuilder(legacy).light, b = DtThemeBuilder(current).light;
      for (final (x, y) in [
        (a.filledButtonTheme.style!, b.filledButtonTheme.style!),
        (a.outlinedButtonTheme.style!, b.outlinedButtonTheme.style!),
        (a.textButtonTheme.style!, b.textButtonTheme.style!),
      ]) {
        expect(x.minimumSize!.resolve({}), y.minimumSize!.resolve({}));
        expect(x.padding!.resolve({}), y.padding!.resolve({}));
        expect(x.side?.resolve({}), y.side?.resolve({}));
        expect(x.foregroundColor?.resolve({}), y.foregroundColor?.resolve({}));
      }
      expect(a.outlinedButtonTheme.style!.side!.resolve({}), BorderSide(color: current.color.light.outline));
      expect(a.textButtonTheme.style!.padding!.resolve({}), const EdgeInsets.symmetric(horizontal: 12));
      expect(a.inputDecorationTheme.contentPadding, b.inputDecorationTheme.contentPadding);
      expect((a.inputDecorationTheme.contentPadding! as EdgeInsets).left, 12);
      expect(a.inputDecorationTheme.enabledBorder!.borderSide.width, 1);
      expect(a.inputDecorationTheme.focusedBorder!.borderSide.width, 2);
      expect(a.chipTheme.padding, b.chipTheme.padding);
      expect(a.chipTheme.selectedColor, current.color.light.secondaryContainer);
      expect(a.badgeTheme.padding, const EdgeInsets.symmetric(horizontal: 4));
      expect(a.dialogTheme.actionsPadding, const EdgeInsets.fromLTRB(24, 0, 24, 24));
    });

    testWidgets('render DtButton, card and chip with the defaults', (tester) async {
      Future<(Size, Size, Offset, Size)> measure(DtTheme theme) async {
        await pump(
          tester,
          SizedBox(
            width: 300,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              DtButton(label: 'Go', size: DtButtonSize.lg, onPressed: () {}),
              DtButton(label: 'Tonal', kind: DtButtonKind.tonal, icon: const Icon(Icons.add), onPressed: () {}),
              const DtCard(title: 'Card'),
              DtChip(label: 'Chip', selected: true, onSelected: (_) {}),
            ]),
          ),
          theme: theme,
        );
        return (
          tester.getSize(materialOf(find.widgetWithText(FilledButton, 'Go'))),
          tester.getSize(materialOf(find.widgetWithText(FilledButton, 'Tonal'))),
          tester.getTopLeft(find.text('Card')) - tester.getTopLeft(find.byType(Card)),
          tester.getSize(find.descendant(of: find.byType(FilterChip), matching: find.byType(Material)).first),
        );
      }

      final legacyResult = await measure(legacy);
      final tonal = tester.widget<Material>(materialOf(find.widgetWithText(FilledButton, 'Tonal')));
      expect(tonal.color, legacy.color.light.secondaryContainer);
      final currentResult = await measure(current);
      expect(legacyResult, currentResult);
      expect(legacyResult.$1.height, 48);
      expect(legacyResult.$3, const Offset(16, 16));
      expect(legacyResult.$4.height, 32);
    });
  });
}
