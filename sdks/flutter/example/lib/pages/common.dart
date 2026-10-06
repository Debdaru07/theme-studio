import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';

/// A scrollable page padded by the theme's layout tokens.
class PageList extends StatelessWidget {
  const PageList({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final layout = context.dt.layout;
    return ListView(
      padding: EdgeInsets.all(layout.pagePadding),
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) SizedBox(height: layout.sectionGap),
          children[i],
        ],
      ],
    );
  }
}

/// A titled group of content.
class Section extends StatelessWidget {
  const Section({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          SizedBox(height: context.dt.spacing.md),
          child,
        ],
      );
}

/// A card padded by `spacing.component.cardPadding`.
class PaddedCard extends StatelessWidget {
  const PaddedCard({super.key, required this.child, this.onTap});

  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: EdgeInsets.all(context.dt.componentSpacing.cardPadding), child: child),
        ),
      );
}
