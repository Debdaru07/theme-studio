import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:theme_studio/theme_studio.dart';

import 'helpers.dart';

const endpoint = 'http://theme.test';
const key = 'pk_demo_acme';

/// Serves `/v1/theme` from [served] and keeps each `/v1/theme/events` stream open for the test to drive.
class FakeApi {
  String served = 'acme';
  final streams = <StreamController<List<int>>>[];
  final eventRequests = <http.BaseRequest>[];
  int themeRequests = 0;
  int eventsStatus = 200;

  late final http.Client client = MockClient.streaming((req, _) async {
    if (req.url.path == '/v1/theme/events') {
      eventRequests.add(req);
      final c = StreamController<List<int>>();
      streams.add(c);
      if (eventsStatus != 200) {
        unawaited(c.close());
        return http.StreamedResponse(c.stream, eventsStatus);
      }
      return http.StreamedResponse(c.stream, 200, headers: {'content-type': 'text/event-stream'});
    }
    themeRequests++;
    final body = utf8.encode(fixtureString(served));
    return http.StreamedResponse(Stream.value(body), 200, headers: {'etag': '"${fixture(served).hash}"'});
  });

  void send(String event, Object data, {int stream = -1}) {
    final c = stream < 0 ? streams.last : streams[stream];
    c.add(utf8.encode(': ping\n\nevent: $event\r\ndata: ${jsonEncode(data)}\n\n'));
  }

  int get open => streams.where((c) => !c.isClosed && c.hasListener).length;
}

Future<void> settle([Duration d = const Duration(milliseconds: 20)]) => Future<void>.delayed(d);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  DynamicThemeClient newClient(FakeApi api) => DynamicThemeClient(endpoint, key, httpClient: api.client, cache: MemoryThemeCache());

  test('connects with the key and refreshes only when the hash changes', () async {
    final api = FakeApi();
    final c = newClient(api);
    await c.init();
    final watch = c.watch();
    await settle();

    expect(api.eventRequests.single.url.toString(), '$endpoint/v1/theme/events');
    expect(api.eventRequests.single.headers['X-Theme-Key'], key);
    expect(api.eventRequests.single.headers['Accept'], 'text/event-stream');

    api.send('theme', {'hash': 'fixture-acme-v1'});
    await settle();
    expect(api.themeRequests, 1);

    api.served = 'globex';
    api.send('theme', {'hash': 'fixture-globex-v1'});
    await settle();
    expect(api.themeRequests, 2);
    expect(c.theme.hash, 'fixture-globex-v1');

    watch.stop();
    await settle();
    expect(api.open, 0);
    c.dispose();
  });

  test('reconnects with backoff when the stream ends or fails', () async {
    final api = FakeApi();
    final c = newClient(api);
    final watch = c.watch(minRetry: const Duration(milliseconds: 10), maxRetry: const Duration(milliseconds: 40));
    await settle();
    expect(api.eventRequests, hasLength(1));

    await api.streams.last.close();
    await settle(const Duration(milliseconds: 30));
    expect(api.eventRequests, hasLength(2));

    api.eventsStatus = 503;
    api.streams.last.addError(http.ClientException('reset'));
    await settle(const Duration(milliseconds: 200));
    expect(api.eventRequests.length, greaterThan(3));

    watch.stop();
    final count = api.eventRequests.length;
    await settle(const Duration(milliseconds: 100));
    expect(api.eventRequests.length, count);
    c.dispose();
  });

  test('revoked stops reconnecting and refreshes once', () async {
    final api = FakeApi();
    final c = newClient(api);
    final watch = c.watch(minRetry: const Duration(milliseconds: 10));
    await settle();
    api.send('revoked', {});
    await settle(const Duration(milliseconds: 60));
    expect(watch.isActive, isFalse);
    expect(api.eventRequests, hasLength(1));
    expect(api.themeRequests, 1);
    c.dispose();
  });

  testWidgets('DynamicThemeBuilder(live: true) connects while resumed and disconnects in the background', (tester) async {
    final api = FakeApi();
    final c = newClient(api);
    await tester.runAsync(() => c.init());

    await tester.pumpWidget(DynamicThemeBuilder(
      client: c,
      autoInit: false,
      live: true,
      builder: (context, data) => const SizedBox(),
    ));
    await tester.runAsync(() => settle());
    expect(api.eventRequests, hasLength(1));

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    await tester.runAsync(() => settle());
    expect(api.open, 0);

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.runAsync(() => settle());
    expect(api.eventRequests, hasLength(2));
    expect(api.themeRequests, 2);

    await tester.pumpWidget(const SizedBox());
    await tester.runAsync(() => settle());
    expect(api.open, 0);
    c.dispose();
  });

  testWidgets('live is off by default', (tester) async {
    final api = FakeApi();
    final c = newClient(api);
    await tester.pumpWidget(DynamicThemeBuilder(client: c, autoInit: false, builder: (context, data) => const SizedBox()));
    await tester.runAsync(() => settle());
    expect(api.eventRequests, isEmpty);
    c.dispose();
  });
}
