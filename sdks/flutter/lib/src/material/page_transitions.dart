import 'package:flutter/material.dart';

import '../models/motion.dart';

/// Page transition driven by `motion.pageTransition`, durations and easings.
///
/// Installed for every platform by `DtThemeBuilder`, so plain `MaterialPageRoute`s
/// pick it up. Honours `respectReducedMotion` + `MediaQuery.disableAnimations`.
class DtPageTransitionsBuilder extends PageTransitionsBuilder {
  const DtPageTransitionsBuilder(this.motion);

  final DtMotion motion;

  @override
  Duration get transitionDuration =>
      motion.pageTransition == DtPageTransition.none ? Duration.zero : motion.duration.medium;

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) =>
      buildTransition(motion, context, animation, secondaryAnimation, child);

  /// Builds the transition outside of a [PageTransitionsTheme], e.g. for a custom route.
  static Widget buildTransition(
    DtMotion motion,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final reduce = motion.respectReducedMotion && (MediaQuery.maybeDisableAnimationsOf(context) ?? false);
    if (reduce) return child;

    // No reverseCurve: that would add a status listener to the route animation on every build.
    final curve = motion.easing.emphasized;
    final enter = CurvedAnimation(parent: animation, curve: curve);
    final exit = CurvedAnimation(parent: secondaryAnimation, curve: curve);
    final dir = Directionality.maybeOf(context);

    switch (motion.pageTransition) {
      case DtPageTransition.none:
        return child;
      case DtPageTransition.fade:
        return FadeTransition(opacity: enter, child: child);
      case DtPageTransition.slide:
        return SlideTransition(
          position: Tween(begin: const Offset(1, 0), end: Offset.zero).animate(enter),
          textDirection: dir,
          child: SlideTransition(
            position: Tween(begin: Offset.zero, end: const Offset(-0.25, 0)).animate(exit),
            textDirection: dir,
            child: child,
          ),
        );
      case DtPageTransition.scale:
        return FadeTransition(
          opacity: enter,
          child: ScaleTransition(
            scale: Tween(begin: 0.92, end: 1.0).animate(enter),
            child: ScaleTransition(scale: Tween(begin: 1.0, end: 1.04).animate(exit), child: child),
          ),
        );
      case DtPageTransition.sharedAxis:
        // Material shared-axis (X): incoming slides in from the trailing side while fading in,
        // outgoing slides toward the leading side while fading out.
        return SlideTransition(
          position: Tween(begin: const Offset(0.1, 0), end: Offset.zero).animate(enter),
          textDirection: dir,
          child: FadeTransition(
            opacity: CurvedAnimation(parent: enter, curve: const Interval(0.3, 1)),
            child: SlideTransition(
              position: Tween(begin: Offset.zero, end: const Offset(-0.1, 0)).animate(exit),
              textDirection: dir,
              child: FadeTransition(
                opacity: Tween(begin: 1.0, end: 0.0)
                    .animate(CurvedAnimation(parent: exit, curve: const Interval(0, 0.3))),
                child: child,
              ),
            ),
          ),
        );
    }
  }
}
