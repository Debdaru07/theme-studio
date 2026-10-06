import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';

import '../demo_settings.dart';
import 'common.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key, required this.settings});

  final DemoSettings settings;

  static const _stats = [
    (Icons.local_shipping, 'Active deliveries', '128'),
    (Icons.timer_outlined, 'On-time rate', '96.4%'),
    (Icons.warning_amber, 'Delayed', '7'),
    (Icons.people_outline, 'Drivers online', '42'),
  ];

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final tt = Theme.of(context).textTheme;

    return PageList(children: [
      _Hero(settings: settings),
      Section(
        title: 'Overview',
        child: LayoutBuilder(builder: (context, constraints) {
          final gap = dt.layout.cardGap;
          final columns = switch (dt.breakpoint) {
            Breakpoint.mobile => 2,
            Breakpoint.tablet => 2,
            _ => 4,
          };
          final width = (constraints.maxWidth - gap * (columns - 1)) / columns;
          return Wrap(spacing: gap, runSpacing: gap, children: [
            for (final (icon, label, value) in _stats)
              SizedBox(
                width: width,
                child: PaddedCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Icon(icon, color: Theme.of(context).colorScheme.primary, size: dt.sizing.icon.lg),
                    SizedBox(height: dt.spacing.sm),
                    Text(value, style: tt.headlineMedium),
                    Text(label, style: tt.bodyMedium?.copyWith(color: dt.colors.onSurfaceMuted)),
                  ]),
                ),
              ),
          ]);
        }),
      ),
      Section(
        title: 'Recent activity',
        child: Card(
          child: Column(children: [
            for (final (status, text) in const [
              ('success', 'Order #1042 delivered'),
              ('warning', 'Order #1043 running 15 min late'),
              ('info', 'New driver onboarded'),
              ('error', 'Order #1039 failed delivery'),
            ])
              ListTile(
                leading: _StatusDot(status: status),
                title: Text(text),
                subtitle: const Text('Just now'),
              ),
          ]),
        ),
      ),
    ]);
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.settings});

  final DemoSettings settings;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final data = DynamicTheme.of(context);
    final meta = data.theme.meta;
    final state = data.state;
    final gradient = dt.gradient;
    final fg = dt.colors.onPrimaryContainer;
    final tt = Theme.of(context).textTheme;

    return Container(
      padding: EdgeInsets.all(dt.spacing.xl),
      decoration: BoxDecoration(
        color: gradient == null ? dt.colors.primaryContainer : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(dt.shape.radius.lg),
        boxShadow: dt.shadow(2),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Welcome to ${data.theme.assets.appName}', style: tt.displaySmall?.copyWith(color: fg)),
        SizedBox(height: dt.spacing.sm),
        Text(
          '${settings.demo.label} · ${meta?.tenant ?? '-'} / ${meta?.client ?? 'base'} v${meta?.version ?? '-'}',
          style: tt.bodyLarge?.copyWith(color: fg),
        ),
        SizedBox(height: dt.spacing.md),
        Wrap(spacing: dt.spacing.sm, runSpacing: dt.spacing.sm, children: [
          Chip(avatar: const Icon(Icons.source_outlined, size: 18), label: Text('source: ${state.source.name}')),
          Chip(avatar: const Icon(Icons.sync, size: 18), label: Text('status: ${state.status.name}')),
          Chip(avatar: const Icon(Icons.devices, size: 18), label: Text('${dt.breakpoint.name} · ${dt.navPattern.name}')),
        ]),
        if (state.status == DtSyncStatus.offline && !settings.offline) ...[
          SizedBox(height: dt.spacing.md),
          Text(
            'Could not reach $kEndpoint. Showing ${state.source.name} theme. '
            'Tap the cloud icon for the offline demo.',
            style: tt.bodyMedium?.copyWith(color: fg),
          ),
        ],
      ]),
    );
  }
}

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final c = context.dt.colors;
    final (bg, fg, icon) = switch (status) {
      'success' => (c.successContainer, c.onSuccessContainer, Icons.check),
      'warning' => (c.warningContainer, c.onWarningContainer, Icons.schedule),
      'error' => (c.errorContainer, c.onErrorContainer, Icons.close),
      _ => (c.infoContainer, c.onInfoContainer, Icons.info_outline),
    };
    return CircleAvatar(backgroundColor: bg, foregroundColor: fg, child: Icon(icon, size: 20));
  }
}
