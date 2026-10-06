/// Runtime, multi-tenant theming for Flutter.
///
/// Fetch a client's resolved theme with [DynamicThemeClient], render with [DynamicThemeApp]
/// (or [DynamicThemeBuilder]), and read tokens Material lacks via `context.dt`.
library;

export 'src/client/cache.dart';
export 'src/client/client.dart';
export 'src/material/fonts.dart';
export 'src/material/page_transitions.dart';
export 'src/material/theme_builder.dart';
export 'src/material/tokens_extension.dart';
export 'src/models/breakpoint.dart';
export 'src/models/color.dart';
export 'src/models/components.dart';
export 'src/models/effects.dart';
export 'src/models/elevation.dart';
export 'src/models/json.dart' show DtThemeFormatException, DtUnsupportedSchemaVersionException, parseHexColor, toHexColor;
export 'src/models/layout.dart';
export 'src/models/motion.dart';
export 'src/models/navigation.dart';
export 'src/models/theme.dart';
export 'src/models/typography.dart';
export 'src/widgets/adaptive_scaffold.dart';
export 'src/widgets/dt_button.dart';
export 'src/widgets/dynamic_theme_builder.dart';
