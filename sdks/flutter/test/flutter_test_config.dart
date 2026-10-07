import 'dart:async';

import 'package:theme_studio/theme_studio.dart';
import 'package:google_fonts/google_fonts.dart';

/// Runs before every test file: never fetch fonts in tests.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  GoogleFonts.config.allowRuntimeFetching = false;
  DtFonts.resolver = DtFonts.system;
  await testMain();
}
