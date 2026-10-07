import 'dart:ui' show Brightness, Color;

import 'json.dart';

/// All 40 color roles of one mode (light or dark), exactly as the schema names them.
class DtColorScheme {
  const DtColorScheme({
    required this.primary,
    required this.onPrimary,
    required this.primaryContainer,
    required this.onPrimaryContainer,
    required this.secondary,
    required this.onSecondary,
    required this.secondaryContainer,
    required this.onSecondaryContainer,
    required this.accent,
    required this.onAccent,
    required this.accentContainer,
    required this.onAccentContainer,
    required this.success,
    required this.onSuccess,
    required this.successContainer,
    required this.onSuccessContainer,
    required this.warning,
    required this.onWarning,
    required this.warningContainer,
    required this.onWarningContainer,
    required this.error,
    required this.onError,
    required this.errorContainer,
    required this.onErrorContainer,
    required this.info,
    required this.onInfo,
    required this.infoContainer,
    required this.onInfoContainer,
    required this.background,
    required this.surface,
    required this.surfaceContainerLow,
    required this.surfaceContainer,
    required this.surfaceContainerHigh,
    required this.onSurface,
    required this.onSurfaceMuted,
    required this.onSurfaceDisabled,
    required this.outline,
    required this.outlineMuted,
    required this.focusRing,
    required this.scrim,
  });

  /// Token names in schema order.
  static const List<String> roles = [
    'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', //
    'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
    'accent', 'onAccent', 'accentContainer', 'onAccentContainer',
    'success', 'onSuccess', 'successContainer', 'onSuccessContainer',
    'warning', 'onWarning', 'warningContainer', 'onWarningContainer',
    'error', 'onError', 'errorContainer', 'onErrorContainer',
    'info', 'onInfo', 'infoContainer', 'onInfoContainer',
    'background', 'surface', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh',
    'onSurface', 'onSurfaceMuted', 'onSurfaceDisabled',
    'outline', 'outlineMuted', 'focusRing', 'scrim',
  ];

  factory DtColorScheme.fromJson(JsonReader r) =>
      DtColorScheme._fromMap({for (final role in roles) role: r.color(role)});

  factory DtColorScheme._fromMap(Map<String, Color> m) => DtColorScheme(
        primary: m['primary']!,
        onPrimary: m['onPrimary']!,
        primaryContainer: m['primaryContainer']!,
        onPrimaryContainer: m['onPrimaryContainer']!,
        secondary: m['secondary']!,
        onSecondary: m['onSecondary']!,
        secondaryContainer: m['secondaryContainer']!,
        onSecondaryContainer: m['onSecondaryContainer']!,
        accent: m['accent']!,
        onAccent: m['onAccent']!,
        accentContainer: m['accentContainer']!,
        onAccentContainer: m['onAccentContainer']!,
        success: m['success']!,
        onSuccess: m['onSuccess']!,
        successContainer: m['successContainer']!,
        onSuccessContainer: m['onSuccessContainer']!,
        warning: m['warning']!,
        onWarning: m['onWarning']!,
        warningContainer: m['warningContainer']!,
        onWarningContainer: m['onWarningContainer']!,
        error: m['error']!,
        onError: m['onError']!,
        errorContainer: m['errorContainer']!,
        onErrorContainer: m['onErrorContainer']!,
        info: m['info']!,
        onInfo: m['onInfo']!,
        infoContainer: m['infoContainer']!,
        onInfoContainer: m['onInfoContainer']!,
        background: m['background']!,
        surface: m['surface']!,
        surfaceContainerLow: m['surfaceContainerLow']!,
        surfaceContainer: m['surfaceContainer']!,
        surfaceContainerHigh: m['surfaceContainerHigh']!,
        onSurface: m['onSurface']!,
        onSurfaceMuted: m['onSurfaceMuted']!,
        onSurfaceDisabled: m['onSurfaceDisabled']!,
        outline: m['outline']!,
        outlineMuted: m['outlineMuted']!,
        focusRing: m['focusRing']!,
        scrim: m['scrim']!,
      );

  final Color primary;
  final Color onPrimary;
  final Color primaryContainer;
  final Color onPrimaryContainer;
  final Color secondary;
  final Color onSecondary;
  final Color secondaryContainer;
  final Color onSecondaryContainer;
  final Color accent;
  final Color onAccent;
  final Color accentContainer;
  final Color onAccentContainer;
  final Color success;
  final Color onSuccess;
  final Color successContainer;
  final Color onSuccessContainer;
  final Color warning;
  final Color onWarning;
  final Color warningContainer;
  final Color onWarningContainer;
  final Color error;
  final Color onError;
  final Color errorContainer;
  final Color onErrorContainer;
  final Color info;
  final Color onInfo;
  final Color infoContainer;
  final Color onInfoContainer;
  final Color background;
  final Color surface;
  final Color surfaceContainerLow;
  final Color surfaceContainer;
  final Color surfaceContainerHigh;
  final Color onSurface;
  final Color onSurfaceMuted;
  final Color onSurfaceDisabled;
  final Color outline;
  final Color outlineMuted;
  final Color focusRing;
  final Color scrim;

  /// Role name → color, in schema order.
  Map<String, Color> toMap() => {
        'primary': primary,
        'onPrimary': onPrimary,
        'primaryContainer': primaryContainer,
        'onPrimaryContainer': onPrimaryContainer,
        'secondary': secondary,
        'onSecondary': onSecondary,
        'secondaryContainer': secondaryContainer,
        'onSecondaryContainer': onSecondaryContainer,
        'accent': accent,
        'onAccent': onAccent,
        'accentContainer': accentContainer,
        'onAccentContainer': onAccentContainer,
        'success': success,
        'onSuccess': onSuccess,
        'successContainer': successContainer,
        'onSuccessContainer': onSuccessContainer,
        'warning': warning,
        'onWarning': onWarning,
        'warningContainer': warningContainer,
        'onWarningContainer': onWarningContainer,
        'error': error,
        'onError': onError,
        'errorContainer': errorContainer,
        'onErrorContainer': onErrorContainer,
        'info': info,
        'onInfo': onInfo,
        'infoContainer': infoContainer,
        'onInfoContainer': onInfoContainer,
        'background': background,
        'surface': surface,
        'surfaceContainerLow': surfaceContainerLow,
        'surfaceContainer': surfaceContainer,
        'surfaceContainerHigh': surfaceContainerHigh,
        'onSurface': onSurface,
        'onSurfaceMuted': onSurfaceMuted,
        'onSurfaceDisabled': onSurfaceDisabled,
        'outline': outline,
        'outlineMuted': outlineMuted,
        'focusRing': focusRing,
        'scrim': scrim,
      };

  /// Looks up a role by its schema name (used for gradient stops). Null if unknown.
  Color? byName(String role) => toMap()[role];

  /// The pseudo-role component tokens use for "no color" (button containers and borders).
  static const String transparentRole = 'transparent';

  /// True for every name [resolve] accepts: the 40 [roles] plus [transparentRole].
  static bool isRole(String name) => name == transparentRole || roles.contains(name);

  /// Maps a color role name from component tokens (`primary`, `onSecondaryContainer`, `outline`, …) to its color
  /// in this mode. `transparent` → fully transparent.
  ///
  /// An unknown name is a bug or a theme from a newer schema: debug builds throw an [ArgumentError] naming it;
  /// release builds fall back to [onSurface] so the app keeps rendering.
  Color resolve(String role) {
    if (role == transparentRole) return const Color(0x00000000);
    final color = byName(role);
    if (color != null) return color;
    assert(() {
      throw ArgumentError.value(role, 'role', 'Unknown color role. Expected one of ${roles.join(', ')} or transparent');
    }());
    return onSurface;
  }

  Map<String, Object?> toJson() => toMap().map((k, v) => MapEntry(k, toHexColor(v)));

  static DtColorScheme lerp(DtColorScheme a, DtColorScheme b, double t) {
    if (identical(a, b)) return a;
    final am = a.toMap(), bm = b.toMap();
    return DtColorScheme._fromMap({
      for (final role in roles) role: Color.lerp(am[role], bm[role], t)!,
    });
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! DtColorScheme) return false;
    final am = toMap(), bm = other.toMap();
    return roles.every((r) => am[r] == bm[r]);
  }

  @override
  int get hashCode => Object.hashAll(toMap().values);
}

/// Light and dark color schemes.
class DtColors {
  const DtColors({required this.light, required this.dark});

  factory DtColors.fromJson(JsonReader r) => DtColors(
        light: DtColorScheme.fromJson(r.obj('light')),
        dark: DtColorScheme.fromJson(r.obj('dark')),
      );

  final DtColorScheme light;
  final DtColorScheme dark;

  DtColorScheme of(Brightness brightness) => brightness == Brightness.dark ? dark : light;

  Map<String, Object?> toJson() => {'light': light.toJson(), 'dark': dark.toJson()};
}
