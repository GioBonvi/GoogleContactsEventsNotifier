/* global Logger Log Priority SimplifiedSemanticVersion log generateEmailNotification */

/**
 * This function throws an error when the condition provided is false.
 *
 * @param {boolean} condition - The condition to be asserted.
 * @param {string} [message=Assertion failed] - The error message thrown if the assertion fails.
 */
function assert (condition, message) {
  if (!condition) {
    throw message || 'Assertion failed';
  }
}

/**
 * Run all the unit tests of the project.
 */
function unitTests () { // eslint-disable-line no-unused-vars
  testLog();
  Logger.log('Log tests passed!');
  testSemVer();
  Logger.log('SimplifiedSemanticVersioning tests passed!');

  Logger.log('All tests passed!');
}

/**
 * Test the Log class.
 */
function testLog () {
  var testLog = new Log(Priority.INFO, Priority.MAX, true);

  // Testing Log.add().
  try {
    testLog.add('', '');
    testLog.add(null, null);
    testLog.add(undefined, undefined);
    assert(testLog.events.length === 3, 'Testing Log.add() failed.');
  } catch (err) {
    assert(false, 'Testing Log.add() failed.');
  }

  // Testing log filtering
  var logs = [
    {name: 'INFO', count: 6},
    {name: 'WARNING', count: 3},
    {name: 'ERROR', count: 2},
    {name: 'FATAL_ERROR', count: 1},
    {name: 'MAX', count: 0}
  ];
  logs.forEach(function (test) {
    var testLog = new Log(Priority[test.name], Priority.MAX, true);
    testLog.add('', '', true);
    testLog.add(null, null, true);
    testLog.add(undefined, undefined, true);
    testLog.add('text', Priority.WARNING, true);
    testLog.add('text', Priority.ERROR, true);
    testLog.add('text', Priority.FATAL_ERROR, true);
    assert(testLog.events.length === test.count, 'Logging with filter "' + test.name + '" failed.');
  });
  // Remove the logs resulting from the tests.
  Logger.clear();
}

/**
 * Test the SimplifiedSemanticVersion class.
 */
function testSemVer () {
  // These version numbers are not valid and should result in errors being thrown.
  var errors = [null, undefined, '', 'randomThings', '1.1', '1.1.1.1'];
  errors.forEach(function (err) {
    try {
      var v = new SimplifiedSemanticVersion(err); // eslint-disable-line no-unused-vars
      assert(false, String(err) + ' was accepted as a valid SemVer.');
    } catch (ex) {}
  });
  // These version numbers are valid and should generate a valid SimplifiedSemanticVersion.
  var valid = ['0.0.1', '123.123.123', '1.1.1+abcd', '1.1.1-abcd', '1.1.1-abcd+efgh', '1.1.1+abcd-efgh'];
  valid.forEach(function (valid) {
    assert((new SimplifiedSemanticVersion(valid)).toString() === valid, valid + ' was not recognized as a valid SemVer.');
  });
  // These version numbers are valid and their comparison should match the expected result.
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

/**
 * Test all events from the selected period. It won't send actual e-mails to you, but put content of them into log.
 *
 * !!! Execution of this function very often exceeds maximum time (30s).
 *
 * @param {Date} [testDate=01/01/CURRENT_YEAR] - First date to test.
 * @param {number} [numberOfDaysToTest=365] - Number of days to test.
 * @param {boolean} [printHTML=false] - Whether or not to print HTML mailContent into log.
 */
function testSelectedPeriod (testDate, numberOfDaysToTest, printHTML) { // eslint-disable-line no-unused-vars
  testDate = testDate || new Date(new Date().getFullYear(), 0, 1, 6, 0, 0);
  numberOfDaysToTest = numberOfDaysToTest || 365;

  log.add('testSelectedPeriod() running checking from ' + testDate.toDateString() + ' for ' + numberOfDaysToTest + ' days.', Priority.INFO);

  for (var i = 0; i < numberOfDaysToTest; i++) {
    var mailContent = generateEmailNotification(testDate);

    if (mailContent !== null) {
      log.add('Subject: ' + mailContent.subject);
      log.add('Content: ' + mailContent.body);
      if (printHTML) {
        log.add('HTML Content: ' + mailContent.htmlBody);
      }
    }

    testDate = new Date(testDate.getTime() + 24 * 60 * 60 * 1000);
  }

  log.add('Test finished.');
}
