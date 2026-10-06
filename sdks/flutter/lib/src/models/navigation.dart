import 'breakpoint.dart';
import 'json.dart';

enum DtNavPattern { bottomBar, rail, drawer, sidebar, topTabs }

enum DtShowLabels { always, selected, never }

enum DtNavIndicator { pill, underline, none }

class DtAppBarTokens {
  const DtAppBarTokens({required this.centeredTitle, required this.elevated, required this.height});

  factory DtAppBarTokens.fromJson(JsonReader r) => DtAppBarTokens(
        centeredTitle: r.boolean('centeredTitle'),
        elevated: r.boolean('elevated'),
        height: r.number('height'),
      );

  final bool centeredTitle;
  final bool elevated;
  final double height;

  Map<String, Object?> toJson() => {'centeredTitle': centeredTitle, 'elevated': elevated, 'height': jsonNum(height)};
}

class DtNavigation {
  const DtNavigation({
    required this.pattern,
    required this.showLabels,
    required this.indicator,
    required this.appBar,
  });

  factory DtNavigation.fromJson(JsonReader r) => DtNavigation(
        pattern: DtPerBreakpoint.fromJson(r.obj('pattern'), (r, k) => r.enumValue(k, DtNavPattern.values)),
        showLabels: r.enumValue('showLabels', DtShowLabels.values),
        indicator: r.enumValue('indicator', DtNavIndicator.values),
        appBar: DtAppBarTokens.fromJson(r.obj('appBar')),
      );

  final DtPerBreakpoint<DtNavPattern> pattern;
  final DtShowLabels showLabels;
  final DtNavIndicator indicator;
  final DtAppBarTokens appBar;

  Map<String, Object?> toJson() => {
        'pattern': pattern.toJson((v) => v.name),
        'showLabels': showLabels.name,
        'indicator': indicator.name,
        'appBar': appBar.toJson(),
      };
}
