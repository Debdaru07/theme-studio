import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;

/// A Server-Sent Events connection to `/v1/theme/events`, from [DynamicThemeClient.watch].
///
/// On a `theme` event whose hash differs from the current theme it calls `refresh()`. Reconnects with
/// exponential backoff until [stop] is called or the key is revoked.
class DtThemeWatch {
  DtThemeWatch({
    required http.Client httpClient,
    required this.uri,
    required this.publishableKey,
    required String? Function() currentHash,
    required Future<void> Function() refresh,
    this.minRetry = const Duration(seconds: 1),
    this.maxRetry = const Duration(seconds: 30),
  })  : _http = httpClient,
        _currentHash = currentHash,
        _refresh = refresh {
    _connect();
  }

  final Uri uri;
  final String publishableKey;
  final Duration minRetry;
  final Duration maxRetry;
  final http.Client _http;
  final String? Function() _currentHash;
  final Future<void> Function() _refresh;
  final Random _random = Random();

  Completer<void>? _abort;
  StreamSubscription<String>? _sub;
  Timer? _retry;
  int _attempt = 0;
  bool _stopped = false;
  bool _revoked = false;
  String _event = 'message';
  final StringBuffer _data = StringBuffer();

  /// False once stopped or revoked.
  bool get isActive => !_stopped && !_revoked;

  Future<void> _connect() async {
    if (!isActive) return;
    final abort = _abort = Completer<void>();
    final req = http.AbortableRequest('GET', uri, abortTrigger: abort.future)
      ..headers.addAll({'Accept': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Theme-Key': publishableKey});
    try {
      final res = await _http.send(req);
      if (!isActive || abort.isCompleted) return;
      if (res.statusCode != 200) {
        unawaited(res.stream.drain<void>().catchError((_) {}));
        return _scheduleRetry();
      }
      _event = 'message';
      _data.clear();
      _sub = res.stream.transform(utf8.decoder).transform(const LineSplitter()).listen(
            _onLine,
            onError: (_) => _scheduleRetry(),
            onDone: _scheduleRetry,
            cancelOnError: true,
          );
    } catch (_) {
      if (!abort.isCompleted) _scheduleRetry();
    }
  }

  void _onLine(String line) {
    if (line.isEmpty) {
      _dispatch(_event, _data.toString());
      _event = 'message';
      _data.clear();
    } else if (line.startsWith('event:')) {
      _event = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      if (_data.isNotEmpty) _data.write('\n');
      _data.write(line.substring(5).trimLeft());
    }
  }

  void _dispatch(String event, String data) {
    switch (event) {
      case 'theme':
        _attempt = 0;
        String? hash;
        try {
          final decoded = jsonDecode(data);
          if (decoded is Map && decoded['hash'] is String) hash = decoded['hash'] as String;
        } catch (_) {}
        if (hash != null && hash != _currentHash()) unawaited(_sync(hash));
      case 'revoked':
        _revoked = true;
        _close();
        unawaited(_refresh());
    }
  }

  Future<void> _sync(String hash) async {
    await _refresh();
    if (isActive && _currentHash() != hash) await _refresh();
  }

  void _scheduleRetry() {
    _close();
    if (!isActive) return;
    final ms = min(maxRetry.inMilliseconds, minRetry.inMilliseconds * pow(2, min(_attempt++, 16)).toInt());
    _retry = Timer(Duration(milliseconds: ms ~/ 2 + _random.nextInt(ms ~/ 2 + 1)), _connect);
  }

  void _close() {
    _retry?.cancel();
    _retry = null;
    final abort = _abort;
    if (abort != null && !abort.isCompleted) abort.complete();
    _abort = null;
    unawaited(_sub?.cancel());
    _sub = null;
  }

  /// Closes the connection and stops reconnecting.
  void stop() {
    _stopped = true;
    _close();
  }
}
