/* global Logger Log */

function assert (condition, message) {
  if (!condition) {
    throw message || 'Assertion failed';
  }
}

function unitTests () {
  // Testing the Log class.
  testLog();
  Logger.log('Log tests passed!');

  Logger.log('All tests passed!');
}

function testLog () {
  var log = new Log('info');

  // Testing Log.add().
  log.add('', '');
  log.add(null, null);
  log.add(undefined, undefined);
  log.add('text', 'random');
  log.add('text', 'none');
  assert(log.events.length === 5, 'Testing Log.add() failed.');

  // Testing log filtering
  var logs = [
    {name: 'info', count: 6},
    {name: 'warning', count: 2},
    {name: 'error', count: 1},
    {name: 'none', count: 0}
  ];
  logs.forEach(function (test) {
    var log = new Log(test.name);
    log.add('', '');
    log.add(null, null);
    log.add(undefined, undefined);
    log.add('text', 'random');
    log.add('text', 'warning');
    log.add('text', 'error');
    assert(log.events.length === test.count, 'Logging with filter "' + test.name + '" failed.');
  });
}
