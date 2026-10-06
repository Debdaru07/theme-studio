import 'json.dart';

/// Layout breakpoints, ordered from narrowest to widest.
enum Breakpoint {
  mobile,
  tablet,
  desktop,
  wide;

  bool operator >=(Breakpoint other) => index >= other.index;
  bool operator <(Breakpoint other) => index < other.index;
}

/// One value per [Breakpoint].
class DtPerBreakpoint<T> {
  const DtPerBreakpoint({
    required this.mobile,
    required this.tablet,
    required this.desktop,
    required this.wide,
  });

  factory DtPerBreakpoint.fromJson(JsonReader r, T Function(JsonReader r, String key) read) =>
      DtPerBreakpoint(
        mobile: read(r, 'mobile'),
        tablet: read(r, 'tablet'),
        desktop: read(r, 'desktop'),
        wide: read(r, 'wide'),
      );

  final T mobile;
  final T tablet;
  final T desktop;
  final T wide;

  T of(Breakpoint bp) => switch (bp) {
        Breakpoint.mobile => mobile,
        Breakpoint.tablet => tablet,
        Breakpoint.desktop => desktop,
        Breakpoint.wide => wide,
      };

  T operator [](Breakpoint bp) => of(bp);

  DtPerBreakpoint<R> map<R>(R Function(T value) f) =>
      DtPerBreakpoint(mobile: f(mobile), tablet: f(tablet), desktop: f(desktop), wide: f(wide));

  Map<String, Object?> toJson(Object? Function(T value) encode) => {
        for (final bp in Breakpoint.values) bp.name: encode(of(bp)),
      };
}

/// Minimum widths (logical px) at which each breakpoint starts; `mobile` starts at 0.
class DtBreakpoints {
  const DtBreakpoints({required this.tablet, required this.desktop, required this.wide});

  factory DtBreakpoints.fromJson(JsonReader r) => DtBreakpoints(
        tablet: r.number('tablet'),
        desktop: r.number('desktop'),
        wide: r.number('wide'),
      );

  final double tablet;
  final double desktop;
  final double wide;

  Breakpoint forWidth(double width) {
    if (width >= wide) return Breakpoint.wide;
    if (width >= desktop) return Breakpoint.desktop;
    if (width >= tablet) return Breakpoint.tablet;
    return Breakpoint.mobile;
  }

  Map<String, Object?> toJson() =>
      {'tablet': jsonNum(tablet), 'desktop': jsonNum(desktop), 'wide': jsonNum(wide)};
}
