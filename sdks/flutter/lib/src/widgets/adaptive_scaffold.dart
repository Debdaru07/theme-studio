import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../material/tokens_extension.dart';
import '../models/navigation.dart';

/// A top-level destination for [DtAdaptiveScaffold].
@immutable
class DtDestination {
  const DtDestination({required this.icon, required this.label, this.selectedIcon});

  final Widget icon;
  final Widget? selectedIcon;
  final String label;
}

/// A scaffold whose navigation follows `navigation.pattern` for the current breakpoint:
/// bottom [NavigationBar], [NavigationRail], modal [NavigationDrawer], permanent sidebar,
/// or a [TabBar] under the app bar. The body is padded by `layout.pagePadding` and limited
/// to `layout.contentMaxWidth`.
class DtAdaptiveScaffold extends StatefulWidget {
  const DtAdaptiveScaffold({
    super.key,
    required this.destinations,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.body,
    this.title,
    this.actions,
    this.floatingActionButton,
    this.padBody = true,
    this.pattern,
    this.sidebarHeader,
  }) : assert(destinations.length >= 2, 'DtAdaptiveScaffold needs at least two destinations');

  final List<DtDestination> destinations;
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final Widget body;
  final Widget? title;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  /// Apply `layout.pagePadding` around [body]. Disable for edge-to-edge scrollables
  /// that pad themselves.
  final bool padBody;

  /// Forces a pattern instead of reading it from the theme (useful for previews).
  final DtNavPattern? pattern;

  /// Shown at the top of the drawer / sidebar. Defaults to `assets.appName`.
  final Widget? sidebarHeader;

  /// Width of the permanent sidebar.
  static const double sidebarWidth = 280;

  @override
  State<DtAdaptiveScaffold> createState() => _DtAdaptiveScaffoldState();
}

class _DtAdaptiveScaffoldState extends State<DtAdaptiveScaffold> with TickerProviderStateMixin {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  TabController? _tabs;

  TabController _tabController() {
    final n = widget.destinations.length;
    var tabs = _tabs;
    if (tabs == null || tabs.length != n) {
      _disposeTabsLater();
      tabs = _tabs = TabController(length: n, initialIndex: widget.selectedIndex.clamp(0, n - 1), vsync: this);
    } else if (tabs.index != widget.selectedIndex && !tabs.indexIsChanging) {
      tabs.animateTo(widget.selectedIndex);
    }
    return tabs;
  }

  /// The old TabBar may still be listening until this frame's tree is finalized.
  void _disposeTabsLater() {
    final old = _tabs;
    _tabs = null;
    if (old != null) WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
  }

  @override
  void dispose() {
    _tabs?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final pattern = widget.pattern ?? dt.navPattern;
    final body = _ConstrainedBody(
      maxWidth: dt.layout.contentMaxWidth,
      padding: widget.padBody ? dt.layout.pagePadding : 0,
      child: widget.body,
    );
    if (pattern != DtNavPattern.topTabs) _disposeTabsLater();

    switch (pattern) {
      case DtNavPattern.bottomBar:
        return Scaffold(
          appBar: _appBar(),
          body: body,
          floatingActionButton: widget.floatingActionButton,
          bottomNavigationBar: NavigationBar(
            selectedIndex: widget.selectedIndex,
            onDestinationSelected: widget.onDestinationSelected,
            destinations: [
              for (final d in widget.destinations)
                NavigationDestination(icon: d.icon, selectedIcon: d.selectedIcon, label: d.label),
            ],
          ),
        );
      case DtNavPattern.rail:
        return Scaffold(
          appBar: _appBar(),
          floatingActionButton: widget.floatingActionButton,
          body: Row(children: [
            NavigationRail(
              selectedIndex: widget.selectedIndex,
              onDestinationSelected: widget.onDestinationSelected,
              destinations: [
                for (final d in widget.destinations)
                  NavigationRailDestination(icon: d.icon, selectedIcon: d.selectedIcon, label: Text(d.label)),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: body),
          ]),
        );
      case DtNavPattern.drawer:
        return Scaffold(
          key: _scaffoldKey,
          appBar: _appBar(),
          body: body,
          floatingActionButton: widget.floatingActionButton,
          drawer: _navigationDrawer(dt, onSelected: (i) {
            _scaffoldKey.currentState?.closeDrawer();
            widget.onDestinationSelected(i);
          }),
        );
      case DtNavPattern.sidebar:
        final theme = Theme.of(context);
        return Scaffold(
          appBar: _appBar(automaticallyImplyLeading: false),
          floatingActionButton: widget.floatingActionButton,
          body: Row(children: [
            SizedBox(
              key: const ValueKey('dt-sidebar'),
              width: DtAdaptiveScaffold.sidebarWidth,
              child: Theme(
                data: theme.copyWith(
                  drawerTheme: theme.drawerTheme.copyWith(
                    shape: const RoundedRectangleBorder(),
                    elevation: 0,
                    width: DtAdaptiveScaffold.sidebarWidth,
                  ),
                ),
                child: _navigationDrawer(dt, onSelected: widget.onDestinationSelected),
              ),
            ),
            const VerticalDivider(width: 1),
            Expanded(child: body),
          ]),
        );
      case DtNavPattern.topTabs:
        final controller = _tabController();
        return Scaffold(
          appBar: _appBar(
            bottom: TabBar(
              controller: controller,
              isScrollable: widget.destinations.length > 5,
              tabAlignment: widget.destinations.length > 5 ? TabAlignment.start : null,
              onTap: widget.onDestinationSelected,
              tabs: [
                for (var i = 0; i < widget.destinations.length; i++)
                  _tab(widget.destinations[i], i == widget.selectedIndex, dt.navigation.showLabels),
              ],
            ),
          ),
          floatingActionButton: widget.floatingActionButton,
          body: body,
        );
    }
  }

  PreferredSizeWidget _appBar({PreferredSizeWidget? bottom, bool automaticallyImplyLeading = true}) => AppBar(
        title: widget.title,
        actions: widget.actions,
        bottom: bottom,
        automaticallyImplyLeading: automaticallyImplyLeading,
      );

  Widget _navigationDrawer(DtContext dt, {required ValueChanged<int> onSelected}) => NavigationDrawer(
        selectedIndex: widget.selectedIndex,
        onDestinationSelected: onSelected,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(dt.spacing.xl, dt.spacing.lg, dt.spacing.lg, dt.spacing.md),
            child: DefaultTextStyle.merge(
              style: Theme.of(context).textTheme.titleMedium,
              child: widget.sidebarHeader ?? Text(dt.assets.appName),
            ),
          ),
          for (final d in widget.destinations)
            NavigationDrawerDestination(icon: d.icon, selectedIcon: d.selectedIcon, label: Text(d.label)),
        ],
      );

  Widget _tab(DtDestination d, bool selected, DtShowLabels show) {
    final icon = selected ? (d.selectedIcon ?? d.icon) : d.icon;
    final label = switch (show) {
      DtShowLabels.always => true,
      DtShowLabels.selected => selected,
      DtShowLabels.never => false,
    };
    return Tab(
      child: Semantics(
        label: label ? null : d.label,
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          icon,
          if (label) ...[const SizedBox(width: 8), Text(d.label)],
        ]),
      ),
    );
  }
}

class _ConstrainedBody extends StatelessWidget {
  const _ConstrainedBody({required this.maxWidth, required this.padding, required this.child});

  final double? maxWidth;
  final double padding;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final padded = padding > 0 ? Padding(padding: EdgeInsets.all(padding), child: child) : child;
    final max = maxWidth;
    if (max == null) return padded;
    return LayoutBuilder(
      builder: (context, constraints) => Align(
        alignment: Alignment.topCenter,
        child: SizedBox(
          width: math.min(constraints.maxWidth, max + padding * 2),
          height: constraints.hasBoundedHeight ? constraints.maxHeight : null,
          child: padded,
        ),
      ),
    );
  }
}
