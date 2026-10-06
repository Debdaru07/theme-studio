import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'helpers.dart';

const destinations = [
  DtDestination(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
  DtDestination(icon: Icon(Icons.list), label: 'Orders'),
  DtDestination(icon: Icon(Icons.settings), label: 'Settings'),
];

const bodyKey = ValueKey('body');

void setWidth(WidgetTester tester, double width) {
  tester.view.physicalSize = Size(width, 900);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

Future<List<int>> pumpScaffold(WidgetTester tester, String fixtureName, double width) async {
  setWidth(tester, width);
  final selected = <int>[];
  await tester.pumpWidget(MaterialApp(
    theme: DtThemeBuilder(fixture(fixtureName)).light,
    home: StatefulBuilder(
      builder: (context, setState) => DtAdaptiveScaffold(
        title: const Text('Title'),
        destinations: destinations,
        selectedIndex: selected.isEmpty ? 0 : selected.last,
        onDestinationSelected: (i) => setState(() => selected.add(i)),
        body: const SizedBox.expand(key: bodyKey),
      ),
    ),
  ));
  await tester.pumpAndSettle();
  return selected;
}

void main() {
  group('DtAdaptiveScaffold — acme (bottomBar / rail / sidebar)', () {
    testWidgets('mobile → NavigationBar', (tester) async {
      final selected = await pumpScaffold(tester, 'acme', 400);
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.byType(NavigationRail), findsNothing);
      expect(find.byType(TabBar), findsNothing);
      await tester.tap(find.text('Orders'));
      expect(selected, [1]);
      // mobile: 16px page padding, no max width.
      expect(tester.getSize(find.byKey(bodyKey)).width, 400 - 32);
    });

    testWidgets('tablet → NavigationRail', (tester) async {
      await pumpScaffold(tester, 'acme', 800);
      expect(find.byType(NavigationRail), findsOneWidget);
      expect(find.byType(NavigationBar), findsNothing);
      expect(tester.widget<NavigationRail>(find.byType(NavigationRail)).extended, isFalse);
    });

    testWidgets('desktop → permanent sidebar', (tester) async {
      final selected = await pumpScaffold(tester, 'acme', 1200);
      expect(find.byKey(const ValueKey('dt-sidebar')), findsOneWidget);
      expect(find.byType(NavigationDrawer), findsOneWidget);
      expect(find.byType(NavigationRail), findsNothing);
      expect(find.text('Acme Fleet'), findsOneWidget);
      await tester.tap(find.text('Settings'));
      expect(selected, [2]);
    });
  });

  group('DtAdaptiveScaffold — globex (drawer / topTabs)', () {
    testWidgets('mobile → modal drawer', (tester) async {
      final selected = await pumpScaffold(tester, 'globex', 400);
      expect(find.byType(NavigationBar), findsNothing);
      expect(find.byType(NavigationDrawer), findsNothing);
      await tester.tap(find.byTooltip('Open navigation menu'));
      await tester.pumpAndSettle();
      expect(find.byType(NavigationDrawer), findsOneWidget);
      await tester.tap(find.text('Orders'));
      await tester.pumpAndSettle();
      expect(selected, [1]);
      expect(find.byType(NavigationDrawer), findsNothing, reason: 'drawer closes after selection');
    });

    testWidgets('tablet → modal drawer', (tester) async {
      await pumpScaffold(tester, 'globex', 800);
      expect(find.byTooltip('Open navigation menu'), findsOneWidget);
      expect(find.byType(NavigationRail), findsNothing);
    });

    testWidgets('desktop → top tabs, labels only on the selected tab', (tester) async {
      final selected = await pumpScaffold(tester, 'globex', 1200);
      expect(find.byType(TabBar), findsOneWidget);
      expect(find.byType(NavigationDrawer), findsNothing);
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Orders'), findsNothing);
      await tester.tap(find.byIcon(Icons.list));
      await tester.pumpAndSettle();
      expect(selected, [1]);
      expect(find.text('Orders'), findsOneWidget);
      expect(find.text('Dashboard'), findsNothing);
    });

    testWidgets('wide → body limited to contentMaxWidth', (tester) async {
      await pumpScaffold(tester, 'globex', 1600);
      expect(find.byType(TabBar), findsOneWidget);
      expect(tester.getSize(find.byKey(bodyKey)).width, 1280);
    });
  });

  testWidgets('switching width switches pattern without errors', (tester) async {
    await pumpScaffold(tester, 'globex', 1200);
    expect(find.byType(TabBar), findsOneWidget);
    setWidth(tester, 400);
    await tester.pumpAndSettle();
    expect(find.byType(TabBar), findsNothing);
    expect(find.byTooltip('Open navigation menu'), findsOneWidget);
  });

  group('DtButton', () {
    Future<void> pumpButton(WidgetTester tester, DtTheme theme) => tester.pumpWidget(MaterialApp(
          theme: DtThemeBuilder(theme).light,
          home: Scaffold(body: DtButton(label: 'save draft', onPressed: () {})),
        ));

    testWidgets('acme → FilledButton', (tester) async {
      await pumpButton(tester, fixture('acme'));
      expect(find.byType(FilledButton), findsOneWidget);
      expect(tester.getSize(find.byType(FilledButton)).height, greaterThanOrEqualTo(40));
    });

    testWidgets('globex → OutlinedButton with beveled shape', (tester) async {
      await pumpButton(tester, fixture('globex'));
      expect(find.byType(OutlinedButton), findsOneWidget);
      final material = tester.widget<Material>(
        find.descendant(of: find.byType(OutlinedButton), matching: find.byType(Material)),
      );
      expect(material.shape, isA<BeveledRectangleBorder>());
    });

    testWidgets('textTransform uppercase', (tester) async {
      final base = fixture('acme');
      final b = base.components.button;
      final theme = base.copyWith(
        components: DtComponents(
          button: DtButtonTokens(
            variant: DtButtonVariant.tonal,
            radius: b.radius,
            height: b.height,
            paddingX: b.paddingX,
            textTransform: DtTextTransform.uppercase,
          ),
          input: base.components.input,
          card: base.components.card,
          dialog: base.components.dialog,
          chip: base.components.chip,
          badge: base.components.badge,
        ),
      );
      await pumpButton(tester, theme);
      expect(find.text('SAVE DRAFT'), findsOneWidget);
    });
  });

  group('page transitions', () {
    Future<void> pushDetail(WidgetTester tester, {bool disableAnimations = false}) async {
      final nav = GlobalKey<NavigatorState>();
      await tester.pumpWidget(MediaQuery(
        data: MediaQueryData(disableAnimations: disableAnimations),
        child: MaterialApp(
          navigatorKey: nav,
          theme: DtThemeBuilder(fixture('acme')).light,
          home: const Text('list'),
        ),
      ));
      nav.currentState!.push(MaterialPageRoute<void>(builder: (_) => const Text('detail')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
    }

    testWidgets('acme slides the new page in', (tester) async {
      await pushDetail(tester);
      final slide = find.ancestor(of: find.text('detail'), matching: find.byType(SlideTransition));
      expect(slide, findsWidgets);
      await tester.pumpAndSettle();
      expect(find.text('detail'), findsOneWidget);
    });

    testWidgets('reduced motion skips the transition', (tester) async {
      await pushDetail(tester, disableAnimations: true);
      final slide = find.ancestor(of: find.text('detail'), matching: find.byType(SlideTransition));
      expect(slide, findsNothing);
    });
  });

  testWidgets('context.dt exposes tokens and breakpoint', (tester) async {
    setWidth(tester, 1100);
    late DtContext dt;
    await tester.pumpWidget(MaterialApp(
      theme: DtThemeBuilder(fixture('acme')).light,
      home: Builder(builder: (context) {
        dt = context.dt;
        return const SizedBox();
      }),
    ));
    expect(dt.breakpoint, Breakpoint.desktop);
    expect(dt.spacing.md, 12);
    expect(dt.layout.pagePadding, 32);
    expect(dt.navPattern, DtNavPattern.sidebar);
    expect(dt.colors.success, fixture('acme').color.light.success);
  });

  testWidgets('context.dt falls back to the bundled default without a DtTokens extension', (tester) async {
    late DtContext dt;
    await tester.pumpWidget(MaterialApp(home: Builder(builder: (context) {
      dt = context.dt;
      return const SizedBox();
    })));
    expect(dt.assets.appName, DtTheme.fallback.assets.appName);
  });

  testWidgets('DynamicThemeApp rebuilds when the client theme arrives', (tester) async {
    setWidth(tester, 400);
    final client = DynamicThemeClient(
      'http://theme.test',
      'pk_demo_globex',
      httpClient: MockClient((_) async => http.Response(fixtureString('globex'), 200)),
      cache: MemoryThemeCache(),
    );
    addTearDown(client.dispose);

    late ThemeData seen;
    await tester.pumpWidget(DynamicThemeApp(
      client: client,
      themeMode: ThemeMode.light,
      home: Builder(builder: (context) {
        seen = Theme.of(context);
        return Text(DynamicTheme.of(context).state.status.name);
      }),
    ));
    expect(seen.colorScheme.primary, DtTheme.fallback.color.light.primary);

    await tester.runAsync(() => client.init());
    await tester.pumpAndSettle();
    expect(seen.colorScheme.primary, const Color(0xFF0F766E));
    expect(find.text('upToDate'), findsOneWidget);
    // Mobile breakpoint → responsive scale 0.9 on display.
    expect(seen.textTheme.displayMedium!.fontSize, closeTo(45 * 0.9, 1e-9));
  });
}
