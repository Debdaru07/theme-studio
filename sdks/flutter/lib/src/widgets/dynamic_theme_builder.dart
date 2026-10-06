import 'dart:async';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../client/cache.dart';
import '../client/client.dart';
import '../material/fonts.dart';
import '../material/theme_builder.dart';
import '../models/breakpoint.dart';
import '../models/theme.dart';

/// What [DynamicThemeBuilder] hands to its builder.
@immutable
class DynamicThemeData {
  const DynamicThemeData({
    required this.theme,
    required this.light,
    required this.dark,
    required this.state,
    required this.breakpoint,
  });

  final DtTheme theme;
  final ThemeData light;
  final ThemeData dark;
  final DtThemeState state;

  /// Breakpoint used for responsive typography.
  final Breakpoint breakpoint;
}

/// Entry points: [DynamicTheme.init] creates a client, [DynamicTheme.of] reads the current data.
abstract final class DynamicTheme {
  /// Creates a [DynamicThemeClient] and starts loading (cache first, then network).
  /// The returned client already holds the cached theme if there is one; pass
  /// [waitForNetwork] to also wait for the first sync.
  static Future<DynamicThemeClient> init({
    required String publishableKey,
    String endpoint = DynamicThemeClient.defaultEndpoint,
    http.Client? httpClient,
    ThemeCache? cache,
    DtTheme? fallbackTheme,
    bool waitForNetwork = false,
  }) async {
    final client = DynamicThemeClient(
      endpoint,
      publishableKey,
      httpClient: httpClient,
      cache: cache,
      fallbackTheme: fallbackTheme,
    );
    final done = client.init();
    // By default wait for the cache only; the network sync continues in the background.
    await (waitForNetwork ? done : client.loadCache());
    return client;
  }

  static DynamicThemeData? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_DynamicThemeScope>()?.data;

  static DynamicThemeData of(BuildContext context) {
    final data = maybeOf(context);
    assert(data != null, 'No DynamicThemeBuilder/DynamicThemeApp above this context.');
    return data!;
  }
}

typedef DynamicThemeWidgetBuilder = Widget Function(BuildContext context, DynamicThemeData data);

/// Rebuilds with light/dark [ThemeData] whenever the client's theme changes.
///
/// Also refreshes on app resume, optionally every [pollInterval], and rebuilds typography
/// when the window crosses a breakpoint.
class DynamicThemeBuilder extends StatefulWidget {
  const DynamicThemeBuilder({
    super.key,
    required this.client,
    required this.builder,
    this.pollInterval,
    this.refreshOnResume = true,
    this.autoInit = true,
    this.responsiveTypography = true,
    this.fonts,
  });

  final DynamicThemeClient client;
  final DynamicThemeWidgetBuilder builder;
  final Duration? pollInterval;
  final bool refreshOnResume;

  /// Calls [DynamicThemeClient.init] on mount.
  final bool autoInit;

  /// Apply `typography.responsiveScale` for the window's breakpoint.
  final bool responsiveTypography;

  /// Overrides [DtFonts.resolver].
  final DtFontResolver? fonts;

  @override
  State<DynamicThemeBuilder> createState() => _DynamicThemeBuilderState();
}

class _DynamicThemeBuilderState extends State<DynamicThemeBuilder> with WidgetsBindingObserver {
  Timer? _poll;
  DynamicThemeData? _cached;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    widget.client.state.addListener(_onChange);
    if (widget.autoInit) widget.client.init();
    _schedulePoll();
  }

  @override
  void didUpdateWidget(DynamicThemeBuilder old) {
    super.didUpdateWidget(old);
    if (old.client != widget.client) {
      old.client.state.removeListener(_onChange);
      widget.client.state.addListener(_onChange);
      if (widget.autoInit) widget.client.init();
      _cached = null;
    }
    if (old.pollInterval != widget.pollInterval || old.client != widget.client) _schedulePoll();
    if (old.fonts != widget.fonts || old.responsiveTypography != widget.responsiveTypography) _cached = null;
  }

  void _schedulePoll() {
    _poll?.cancel();
    final interval = widget.pollInterval;
    _poll = interval == null ? null : Timer.periodic(interval, (_) => widget.client.refresh());
  }

  void _onChange() {
    if (mounted) setState(() {});
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && widget.refreshOnResume) widget.client.refresh();
  }

  @override
  void didChangeMetrics() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _poll?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    widget.client.state.removeListener(_onChange);
    super.dispose();
  }

  double _width(BuildContext context) {
    final mq = MediaQuery.maybeSizeOf(context);
    if (mq != null) return mq.width;
    final view = View.maybeOf(context);
    return view == null ? 0 : view.physicalSize.width / view.devicePixelRatio;
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.client.state.value;
    final theme = state.theme;
    final bp = widget.responsiveTypography ? theme.sizing.breakpoints.forWidth(_width(context)) : Breakpoint.tablet;

    var data = _cached;
    if (data == null || !identical(data.theme, theme) || data.breakpoint != bp) {
      final builder = DtThemeBuilder(theme, breakpoint: bp, fonts: widget.fonts);
      data = DynamicThemeData(theme: theme, light: builder.light, dark: builder.dark, state: state, breakpoint: bp);
    } else if (!identical(data.state, state)) {
      data = DynamicThemeData(theme: theme, light: data.light, dark: data.dark, state: state, breakpoint: bp);
    }
    _cached = data;
    return _DynamicThemeScope(data: data, child: Builder(builder: (context) => widget.builder(context, data!)));
  }
}

class _DynamicThemeScope extends InheritedWidget {
  const _DynamicThemeScope({required this.data, required super.child});

  final DynamicThemeData data;

  @override
  bool updateShouldNotify(_DynamicThemeScope old) => !identical(old.data, data);
}

/// A [MaterialApp] themed by a [DynamicThemeClient]. For `MaterialApp.router` or other
/// setups, use [DynamicThemeBuilder] directly.
class DynamicThemeApp extends StatelessWidget {
  const DynamicThemeApp({
    super.key,
    required this.client,
    this.themeMode = ThemeMode.system,
    this.home,
    this.routes = const {},
    this.initialRoute,
    this.onGenerateRoute,
    this.navigatorKey,
    this.scaffoldMessengerKey,
    this.title,
    this.builder,
    this.debugShowCheckedModeBanner = true,
    this.localizationsDelegates,
    this.supportedLocales = const [Locale('en', 'US')],
    this.locale,
    this.pollInterval,
    this.refreshOnResume = true,
    this.fonts,
  });

  final DynamicThemeClient client;
  final ThemeMode themeMode;
  final Widget? home;
  final Map<String, WidgetBuilder> routes;
  final String? initialRoute;
  final RouteFactory? onGenerateRoute;
  final GlobalKey<NavigatorState>? navigatorKey;
  final GlobalKey<ScaffoldMessengerState>? scaffoldMessengerKey;

  /// Defaults to `assets.appName`.
  final String? title;
  final TransitionBuilder? builder;
  final bool debugShowCheckedModeBanner;
  final Iterable<LocalizationsDelegate<dynamic>>? localizationsDelegates;
  final Iterable<Locale> supportedLocales;
  final Locale? locale;
  final Duration? pollInterval;
  final bool refreshOnResume;
  final DtFontResolver? fonts;

  @override
  Widget build(BuildContext context) => DynamicThemeBuilder(
        client: client,
        pollInterval: pollInterval,
        refreshOnResume: refreshOnResume,
        fonts: fonts,
        builder: (context, data) => MaterialApp(
          title: title ?? data.theme.assets.appName,
          theme: data.light,
          darkTheme: data.dark,
          themeMode: themeMode,
          home: home,
          routes: routes,
          initialRoute: initialRoute,
          onGenerateRoute: onGenerateRoute,
          navigatorKey: navigatorKey,
          scaffoldMessengerKey: scaffoldMessengerKey,
          builder: builder,
          debugShowCheckedModeBanner: debugShowCheckedModeBanner,
          localizationsDelegates: localizationsDelegates,
          supportedLocales: supportedLocales,
          locale: locale,
        ),
      );
}
