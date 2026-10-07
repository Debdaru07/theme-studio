import 'package:theme_studio/theme_studio.dart';
import 'package:dynamic_theme_example/demo_settings.dart';
import 'package:dynamic_theme_example/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  setUp(() => DtFonts.resolver = DtFonts.system);

  testWidgets('offline demo switches between Acme and Globex', (tester) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final settings = DemoSettings()..offline = true;
    await tester.pumpWidget(ExampleApp(settings: settings));
    await tester.runAsync(() => settings.themeClient.init());
    await tester.pumpAndSettle();

    expect(find.text('Acme Fleet'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);

    settings.demo = DemoClient.globex;
    await tester.pump();
    await tester.runAsync(() => settings.themeClient.init());
    await tester.pumpAndSettle();

    expect(find.text('Globex Care'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
    expect(find.byTooltip('Open navigation menu'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
    settings.dispose();
  });
}
