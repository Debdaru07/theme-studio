import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';

import 'demo_settings.dart';
import 'pages/components_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/form_page.dart';
import 'pages/orders_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.settings});

  final DemoSettings settings;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _destinations = [
    DtDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
    DtDestination(icon: Icon(Icons.local_shipping_outlined), selectedIcon: Icon(Icons.local_shipping), label: 'Orders'),
    DtDestination(icon: Icon(Icons.edit_note_outlined), selectedIcon: Icon(Icons.edit_note), label: 'Form'),
    DtDestination(icon: Icon(Icons.widgets_outlined), selectedIcon: Icon(Icons.widgets), label: 'Components'),
  ];

  @override
  Widget build(BuildContext context) {
    final settings = widget.settings;
    final data = DynamicTheme.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return DtAdaptiveScaffold(
      title: Text(data.theme.assets.appName),
      padBody: false,
      selectedIndex: _index,
      onDestinationSelected: (i) => setState(() => _index = i),
      destinations: _destinations,
      actions: [
        PopupMenuButton<DemoClient>(
          tooltip: 'Switch client',
          icon: const Icon(Icons.swap_horiz),
          initialValue: settings.demo,
          onSelected: (d) => settings.demo = d,
          itemBuilder: (_) => [
            for (final d in DemoClient.values) PopupMenuItem(value: d, child: Text('${d.label} (${d.publishableKey})')),
          ],
        ),
        IconButton(
          tooltip: settings.offline ? 'Offline demo (bundled fixtures)' : 'Live: $kEndpoint',
          icon: Icon(settings.offline ? Icons.cloud_off : Icons.cloud_outlined),
          onPressed: () => settings.offline = !settings.offline,
        ),
        IconButton(
          tooltip: isDark ? 'Light mode' : 'Dark mode',
          icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
          onPressed: () => settings.themeMode = isDark ? ThemeMode.light : ThemeMode.dark,
        ),
        IconButton(
          tooltip: 'Refresh theme',
          icon: const Icon(Icons.refresh),
          onPressed: settings.themeClient.refresh,
        ),
        const SizedBox(width: 8),
      ],
      body: switch (_index) {
        0 => DashboardPage(settings: settings),
        1 => const OrdersPage(),
        2 => const FormPage(),
        _ => const ComponentsPage(),
      },
    );
  }
}
