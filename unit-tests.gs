/* global Logger Log SimplifiedSemanticVersion */

function assert (condition, message) {
  if (!condition) {
    throw message || 'Assertion failed';
  }
}

function unitTests () {
  // Testing the Log class.
  testLog();
  Logger.log('Log tests passed!');
  testSemVer();
  Logger.log('SimplifiedSemanticVersioning tests passed!');

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
  // Remove the logs resulting from the tests.
  Logger.clear();
}

function testSemVer () {
  var errors = [null, undefined, '', 'randomThings', '1.1', '1.1.1.1'];
  errors.forEach(function (err) {
    try {
      var v = new SimplifiedSemanticVersion(err);
      assert(false, String(err) + ' was accepted as a valid SemVer.');
    } catch (ex) {}
  });

  var valid = ['0.0.1', '123.123.123', '1.1.1+abcd', '1.1.1-abcd', '1.1.1-abcd+efgh', '1.1.1+abcd-efgh'];
  valid.forEach(function (valid) {
    assert((new SimplifiedSemanticVersion(valid)).toString() === valid, valid + ' was not recognized as a valid SemVer.');
  });

  var compare = [
    {v1: '0.0.1', v2: '0.0.1', result: 0},
    {v1: '0.0.1+abc', v2: '0.0.1+def', result: 0},
    {v1: '0.0.1+abc', v2: '0.0.1', result: 0},
    {v1: '0.0.1', v2: '0.0.1-alpha', result: 1},
    {v1: '0.0.2', v2: '0.0.1', result: 1},
    {v1: '0.0.2', v2: '0.0.1-alpha', result: 1},
    {v1: '0.1.0', v2: '0.0.1', result: 1},
    {v1: '0.1.0', v2: '0.0.1-alpha', result: 1},
    {v1: '1.0.0', v2: '0.0.1', result: 1},
    {v1: '1.0.0', v2: '0.1.0', result: 1}
  ];
  compare.forEach(function (comp) {
    var v1 = new SimplifiedSemanticVersion(comp.v1);
    var v2 = new SimplifiedSemanticVersion(comp.v2);
    assert(v1.compare(v2) === comp.result, 'Comparison between ' + comp.v1 + ' and ' + comp.v2 + ' did not return the expected value of ' + comp.result);
    assert(v2.compare(v1) === (-comp.result), 'Comparison between ' + comp.v2 + ' and ' + comp.v1 + ' did not return the expected value of ' + (-comp.result));
  });
}
