import 'package:flutter/painting.dart';
import 'package:google_fonts/google_fonts.dart';

/// Applies font [family] to [style]. Must not throw.
typedef DtFontResolver = TextStyle Function(String family, TextStyle style);

/// Font resolution used by the theme builder unless one is passed explicitly.
abstract final class DtFonts {
  /// Loads [family] via `google_fonts`, falling back to a plain `fontFamily`
  /// (platform font lookup) when the family is not in the Google Fonts catalog.
  /// The style's `fontWeight` and `fontStyle` select the Google Fonts variant.
  static TextStyle google(String family, TextStyle style) {
    try {
      return GoogleFonts.getFont(
        family,
        textStyle: style,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
      );
    } catch (_) {
      return system(family, style);
    }
  }

  /// Sets `fontFamily` only (weight and `fontStyle` are kept); never fetches anything. Use in tests or offline builds
  /// that bundle their fonts.
  static TextStyle system(String family, TextStyle style) => style.copyWith(fontFamily: family);

  /// Global default. Set to [DtFonts.system] in tests to avoid font fetching.
  static DtFontResolver resolver = google;
}
