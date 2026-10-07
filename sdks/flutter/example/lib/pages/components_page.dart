import 'package:theme_studio/theme_studio.dart';
import 'package:flutter/material.dart';

import 'common.dart';

class ComponentsPage extends StatefulWidget {
  const ComponentsPage({super.key});

  @override
  State<ComponentsPage> createState() => _ComponentsPageState();
}

class _ComponentsPageState extends State<ComponentsPage> {
  final Set<String> _filters = {'Today'};

  void _showDialog() => showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          icon: const Icon(Icons.delete_outline),
          title: const Text('Cancel delivery?'),
          content: const Text('The driver will be notified and the slot released.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep')),
            DtButton(label: 'Cancel delivery', onPressed: () => Navigator.pop(context)),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final s = dt.spacing.sm;
    final c = dt.colors;
    final tt = Theme.of(context).textTheme;

    return PageList(children: [
      Section(
        title: 'Buttons (theme variant: ${dt.components.button.variant.name})',
        child: Wrap(spacing: s, runSpacing: s, children: [
          DtButton(label: 'DtButton', onPressed: () {}),
          DtButton(label: 'With icon', icon: const Icon(Icons.add), onPressed: () {}),
          FilledButton(onPressed: () {}, child: const Text('Filled')),
          FilledButton.tonal(onPressed: () {}, child: const Text('Tonal')),
          OutlinedButton(onPressed: () {}, child: const Text('Outlined')),
          ElevatedButton(onPressed: () {}, child: const Text('Elevated')),
          TextButton(onPressed: () {}, child: const Text('Text')),
          const DtButton(label: 'Disabled', onPressed: null),
        ]),
      ),
      Section(
        title: 'Dialog & snackbar',
        child: Wrap(spacing: s, runSpacing: s, children: [
          OutlinedButton.icon(onPressed: _showDialog, icon: const Icon(Icons.open_in_new), label: const Text('Dialog')),
          OutlinedButton.icon(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: const Text('Theme applied'), action: SnackBarAction(label: 'Undo', onPressed: () {})),
            ),
            icon: const Icon(Icons.notifications_none),
            label: const Text('Snackbar'),
          ),
        ]),
      ),
      Section(
        title: 'Chips',
        child: Wrap(spacing: s, runSpacing: s, children: [
          for (final f in const ['Today', 'This week', 'Late', 'Delivered'])
            FilterChip(
              label: Text(f),
              selected: _filters.contains(f),
              onSelected: (on) => setState(() => on ? _filters.add(f) : _filters.remove(f)),
            ),
          ActionChip(avatar: const Icon(Icons.add, size: 18), label: const Text('Add filter'), onPressed: () {}),
          InputChip(label: const Text('Auckland'), onDeleted: () {}),
        ]),
      ),
      Section(
        title: 'Badges',
        child: Wrap(spacing: dt.spacing.xl, runSpacing: s, children: const [
          Badge(label: Text('3'), child: Icon(Icons.inbox_outlined)),
          Badge(label: Text('99+'), child: Icon(Icons.notifications_none)),
          Badge(child: Icon(Icons.chat_bubble_outline)),
        ]),
      ),
      Section(
        title: 'Semantic colors',
        child: Wrap(spacing: s, runSpacing: s, children: [
          for (final (name, bg, fg) in [
            ('success', c.successContainer, c.onSuccessContainer),
            ('warning', c.warningContainer, c.onWarningContainer),
            ('info', c.infoContainer, c.onInfoContainer),
            ('error', c.errorContainer, c.onErrorContainer),
            ('accent', c.accentContainer, c.onAccentContainer),
          ])
            Container(
              padding: EdgeInsets.symmetric(horizontal: dt.spacing.lg, vertical: dt.spacing.md),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(dt.shape.radius.sm)),
              child: Text(name, style: tt.labelLarge?.copyWith(color: fg)),
            ),
        ]),
      ),
      Section(
        title: 'Elevation',
        child: Wrap(spacing: dt.spacing.lg, runSpacing: dt.spacing.lg, children: [
          for (var level = 0; level <= 5; level++)
            Container(
              width: 88,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(dt.shape.radius.md),
                boxShadow: dt.shadow(level),
              ),
              child: Text('level$level', style: tt.labelMedium),
            ),
        ]),
      ),
    ]);
  }
}
