import 'package:flutter/animation.dart';

import 'json.dart';

enum DtPageTransition { fade, slide, scale, sharedAxis, none }

class DtDurations {
  const DtDurations({required this.short, required this.medium, required this.long});

  factory DtDurations.fromJson(JsonReader r) => DtDurations(
        short: _ms(r.number('short')),
        medium: _ms(r.number('medium')),
        long: _ms(r.number('long')),
      );

  static Duration _ms(double v) => Duration(microseconds: (v * 1000).round());

  final Duration short;
  final Duration medium;
  final Duration long;

  Map<String, Object?> toJson() => {
        'short': jsonNum(short.inMicroseconds / 1000),
        'medium': jsonNum(medium.inMicroseconds / 1000),
        'long': jsonNum(long.inMicroseconds / 1000),
      };
}

class DtEasings {
  const DtEasings({
    required this.standard,
    required this.emphasized,
    required this.decelerate,
    required this.accelerate,
  });

  factory DtEasings.fromJson(JsonReader r) {
    Cubic c(String k) {
      final v = r.numberList(k, length: 4);
      return Cubic(v[0], v[1], v[2], v[3]);
    }

    return DtEasings(
      standard: c('standard'),
      emphasized: c('emphasized'),
      decelerate: c('decelerate'),
      accelerate: c('accelerate'),
    );
  }

  final Cubic standard;
  final Cubic emphasized;
  final Cubic decelerate;
  final Cubic accelerate;

  static List<num> _enc(Cubic c) => [jsonNum(c.a), jsonNum(c.b), jsonNum(c.c), jsonNum(c.d)];

  Map<String, Object?> toJson() => {
        'standard': _enc(standard),
        'emphasized': _enc(emphasized),
        'decelerate': _enc(decelerate),
        'accelerate': _enc(accelerate),
      };
}

class DtMotion {
  const DtMotion({
    required this.duration,
    required this.easing,
    required this.pageTransition,
    required this.respectReducedMotion,
  });

  factory DtMotion.fromJson(JsonReader r) => DtMotion(
        duration: DtDurations.fromJson(r.obj('duration')),
        easing: DtEasings.fromJson(r.obj('easing')),
        pageTransition: r.enumValue('pageTransition', DtPageTransition.values),
        respectReducedMotion: r.boolean('respectReducedMotion'),
      );

  final DtDurations duration;
  final DtEasings easing;
  final DtPageTransition pageTransition;
  final bool respectReducedMotion;

  DtMotion copyWith({DtPageTransition? pageTransition, bool? respectReducedMotion}) => DtMotion(
        duration: duration,
        easing: easing,
        pageTransition: pageTransition ?? this.pageTransition,
        respectReducedMotion: respectReducedMotion ?? this.respectReducedMotion,
      );

  Map<String, Object?> toJson() => {
        'duration': duration.toJson(),
        'easing': easing.toJson(),
        'pageTransition': pageTransition.name,
        'respectReducedMotion': respectReducedMotion,
      };
}
