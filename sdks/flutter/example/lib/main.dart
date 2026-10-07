import 'package:theme_studio/theme_studio.dart';
import 'package:flutter/material.dart';

import 'demo_settings.dart';
import 'home_shell.dart';

void main() => runApp(ExampleApp(settings: DemoSettings()));

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key, required this.settings});

  final DemoSettings settings;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: settings,
        builder: (context, _) => DynamicThemeApp(
          client: settings.themeClient,
          themeMode: settings.themeMode,
          pollInterval: const Duration(seconds: 30),
          debugShowCheckedModeBanner: false,
          home: HomeShell(settings: settings),
        ),
      );
}
