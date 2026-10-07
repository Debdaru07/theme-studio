import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers.dart';

/// Pumps [child] in a themed app (Globex: outlined buttons, filled inputs).
Future<void> pump(WidgetTester tester, Widget child, {String theme = 'globex'}) async {
  await tester.pumpWidget(MaterialApp(
    theme: DtThemeBuilder(fixture(theme)).light,
    home: Scaffold(body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: child)),
  ));
}

void main() {
  group('DtButton', () {
    testWidgets('follows the theme variant; danger and text override it', (tester) async {
      await pump(tester, Column(children: [
        DtButton(label: 'Theme', onPressed: () {}),
        DtButton(label: 'Delete', danger: true, onPressed: () {}),
        DtButton(label: 'Later', text: true, onPressed: () {}),
      ]));
      expect(find.widgetWithText(OutlinedButton, 'Theme'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Delete'), findsOneWidget);
      expect(find.widgetWithText(TextButton, 'Later'), findsOneWidget);
    });

    testWidgets('loading blocks presses and shows progress', (tester) async {
      var pressed = 0;
      await pump(tester, DtButton(label: 'Save', loading: true, onPressed: () => pressed++));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(find.text('Save'), warnIfMissed: false);
      expect(pressed, 0);
      expect(find.bySemanticsLabel('Save, loading'), findsOneWidget);
    });

    testWidgets('loaders use theme colors, never Material defaults', (tester) async {
      final colors = fixture('globex').color.of(Brightness.light);
      await pump(tester, Column(children: [
        DtButton(label: 'Save', loading: true, onPressed: () {}),
        const DtProgress(label: 'Upload', value: 40),
      ]));
      final spinner = tester.widget<CircularProgressIndicator>(find.byType(CircularProgressIndicator));
      expect(spinner.color, colors.onSurfaceDisabled);
      final bar = tester.widget<LinearProgressIndicator>(find.byType(LinearProgressIndicator));
      expect(bar.color, colors.primary);
      expect(bar.backgroundColor, colors.secondaryContainer);
    });
  });

  testWidgets('DtIconButton uses its label as the tooltip', (tester) async {
    await pump(tester, DtIconButton(label: 'Search', icon: const Icon(Icons.search), onPressed: () {}));
    expect(find.byTooltip('Search'), findsOneWidget);
  });

  testWidgets('DtTextField shows label, hint and error', (tester) async {
    await pump(tester, const DtTextField(label: 'Email', hint: 'Work address', error: 'Enter a valid email'));
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Enter a valid email'), findsOneWidget);
    // Material shows the error in place of the helper text.
    expect(find.text('Work address'), findsNothing);
  });

  testWidgets('DtCheckbox and DtSwitch toggle', (tester) async {
    var checked = false;
    var on = false;
    await pump(
      tester,
      StatefulBuilder(
        builder: (context, setState) => Column(children: [
          DtCheckbox(label: 'I agree', value: checked, onChanged: (v) => setState(() => checked = v)),
          DtSwitch(label: 'Alerts', value: on, onChanged: (v) => setState(() => on = v)),
        ]),
      ),
    );
    await tester.tap(find.text('I agree'));
    await tester.tap(find.text('Alerts'));
    await tester.pump();
    expect(checked, isTrue);
    expect(on, isTrue);
  });

  testWidgets('DtChip is a filter chip, or an input chip with a remove button', (tester) async {
    var removed = false;
    await pump(tester, Wrap(children: [
      DtChip(label: 'Email', selected: true, onSelected: (_) {}),
      DtChip(label: 'Auckland', onDeleted: () => removed = true),
    ]));
    expect(find.widgetWithText(FilterChip, 'Email'), findsOneWidget);
    await tester.tap(find.byTooltip('Remove Auckland'));
    expect(removed, isTrue);
  });

  testWidgets('status, badge, avatar and stat card carry text', (tester) async {
    await pump(tester, Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const DtStatusChip(label: 'Delayed', tone: DtTone.warning),
      const DtBadge(label: '250 notifications', count: 250, child: Icon(Icons.notifications)),
      const DtAvatar(name: 'Sam Kirk'),
      const DtStatCard(label: 'Exceptions', value: '7', delta: '+3', deltaTone: DtTone.error),
    ]));
    expect(find.text('Delayed'), findsOneWidget);
    expect(find.text('99+'), findsOneWidget);
    expect(find.text('SK'), findsOneWidget);
    expect(find.bySemanticsLabel('Sam Kirk'), findsOneWidget);
    expect(find.text('+3'), findsOneWidget);
  });

  testWidgets('DtCard variants map to Material cards', (tester) async {
    await pump(tester, Column(children: [
      DtCard(title: 'Elevated', actions: [DtButton(label: 'Open', onPressed: () {})]),
      const DtCard(variant: DtCardVariant.outlined, title: 'Outlined'),
      const DtCard(variant: DtCardVariant.filled, title: 'Filled'),
    ]));
    expect(find.byType(Card), findsNWidgets(3));
    expect(find.text('Open'), findsOneWidget);
  });

  testWidgets('DtListItem, DtEmptyState, DtAlert and DtProgress render', (tester) async {
    var tapped = false;
    await pump(tester, Column(children: [
      DtListItem(headline: 'NW-1042', supporting: 'Auckland', onTap: () => tapped = true),
      const DtEmptyState(title: 'No orders yet', description: 'Create one to get started.'),
      const DtAlert(tone: DtTone.error, title: 'Payment failed'),
      const DtProgress(label: 'Upload', value: 40),
      const DtSkeleton(lines: 3),
    ]));
    await tester.tap(find.text('NW-1042'));
    expect(tapped, isTrue);
    expect(find.text('No orders yet'), findsOneWidget);
    expect(find.text('Payment failed'), findsOneWidget);
    expect(find.byType(LinearProgressIndicator), findsOneWidget);
  });

  testWidgets('showDtConfirmDialog resolves true on confirm and false on cancel', (tester) async {
    bool? result;
    await pump(
      tester,
      Builder(
        builder: (context) => DtButton(
          label: 'Delete client',
          onPressed: () async => result = await showDtConfirmDialog(context, title: 'Delete client?', confirmLabel: 'Delete', destructive: true),
        ),
      ),
    );
    await tester.tap(find.text('Delete client'));
    await tester.pumpAndSettle();
    expect(find.text('Delete client?'), findsOneWidget);
    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(result, isTrue);

    await tester.tap(find.text('Delete client'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(result, isFalse);
  });

  testWidgets('showDtToast shows a floating SnackBar with an action', (tester) async {
    var undone = false;
    await pump(
      tester,
      Builder(
        builder: (context) => DtButton(
          label: 'Archive',
          onPressed: () => showDtToast(context, 'Order archived', actionLabel: 'Undo', onAction: () => undone = true),
        ),
      ),
    );
    await tester.tap(find.text('Archive'));
    await tester.pumpAndSettle(); // let the SnackBar finish sliding in
    expect(find.text('Order archived'), findsOneWidget);
    await tester.tap(find.text('Undo'));
    expect(undone, isTrue);
  });

  testWidgets('DtTabs switches content', (tester) async {
    int? changed;
    await pump(
      tester,
      DtTabs(
        onChanged: (i) => changed = i,
        items: const [
          DtTabItem(label: 'Summary', content: Text('Summary panel')),
          DtTabItem(label: 'Invoice', content: Text('Invoice panel')),
        ],
      ),
    );
    expect(find.text('Summary panel'), findsOneWidget);
    await tester.tap(find.text('Invoice'));
    await tester.pumpAndSettle();
    expect(find.text('Invoice panel'), findsOneWidget);
    expect(changed, 1);
  });
}
