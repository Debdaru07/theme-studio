import 'package:theme_studio/theme_studio.dart';
import 'package:flutter/material.dart';

import 'common.dart';

typedef Order = ({int id, String customer, String city, int items, bool late});

final List<Order> _orders = [
  for (var i = 0; i < 24; i++)
    (
      id: 1040 + i,
      customer: const ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin', 'Litware'][i % 5],
      city: const ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'][i % 4],
      items: 1 + (i * 7) % 12,
      late: i % 6 == 3,
    ),
];

class OrdersPage extends StatelessWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    return ListView.separated(
      padding: EdgeInsets.all(dt.layout.pagePadding),
      itemCount: _orders.length,
      separatorBuilder: (_, _) => SizedBox(height: dt.componentSpacing.listGap),
      itemBuilder: (context, i) {
        final o = _orders[i];
        return Card(
          child: ListTile(
            leading: CircleAvatar(child: Text('${o.items}')),
            title: Text('Order #${o.id}'),
            subtitle: Text('${o.customer} · ${o.city}'),
            trailing: o.late
                ? Chip(
                    label: const Text('Late'),
                    backgroundColor: dt.colors.warningContainer,
                    labelStyle: TextStyle(color: dt.colors.onWarningContainer),
                  )
                : const Icon(Icons.chevron_right),
            // Uses the theme's page transition (motion.pageTransition).
            onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => OrderDetailPage(order: o))),
          ),
        );
      },
    );
  }
}

class OrderDetailPage extends StatelessWidget {
  const OrderDetailPage({super.key, required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final tt = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text('Order #${order.id}')),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: dt.layout.contentMaxWidth ?? double.infinity),
          child: PageList(children: [
            PaddedCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(order.customer, style: tt.headlineMedium),
                SizedBox(height: dt.spacing.xs),
                Text(order.city, style: tt.bodyLarge?.copyWith(color: dt.colors.onSurfaceMuted)),
                SizedBox(height: dt.spacing.lg),
                Wrap(spacing: dt.spacing.sm, children: [
                  Chip(label: Text('${order.items} items')),
                  Chip(
                    label: Text(order.late ? 'Running late' : 'On schedule'),
                    backgroundColor: order.late ? dt.colors.warningContainer : dt.colors.successContainer,
                    labelStyle: TextStyle(
                      color: order.late ? dt.colors.onWarningContainer : dt.colors.onSuccessContainer,
                    ),
                  ),
                ]),
              ]),
            ),
            Wrap(spacing: dt.spacing.sm, runSpacing: dt.spacing.sm, children: [
              DtButton(label: 'Mark delivered', icon: const Icon(Icons.check), onPressed: () => Navigator.pop(context)),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Back')),
            ]),
          ]),
        ),
      ),
    );
  }
}
