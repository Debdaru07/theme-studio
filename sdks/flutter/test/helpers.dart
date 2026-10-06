import 'dart:convert';
import 'dart:io';

import 'package:dynamic_theme/dynamic_theme.dart';

const fixtureNames = ['default', 'acme', 'globex'];

String fixtureString(String name) => File('test/fixtures/$name.json').readAsStringSync();

Map<String, dynamic> fixtureJson(String name) => jsonDecode(fixtureString(name)) as Map<String, dynamic>;

DtTheme fixture(String name) => DtTheme.fromJsonString(fixtureString(name));

