/* global Logger Log Priority SimplifiedSemanticVersion log generateEmailNotification dateWithTimezone Utilities MailApp settings validateSettings */

/**
 * This function throws an error when the condition provided is false.
 *
 * @param {?boolean} condition - The condition to be asserted.
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
  testDSTCorrectness();
  Logger.log('DST correctness tests passed!');
  Logger.log('All tests passed!');
}

/**
 * Test the `Log` class.
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
 * Test the `SimplifiedSemanticVersion` class.
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
 * Test whether dateWithTimezone() handles daylight saving time (DST) as expected.
 */
function testDSTCorrectness () {
  var timezone, date, expectedDate, dateDSTon, dateDSToff, now;

  now = new Date();
  timezone = 'Europe/Athens';

  /*
   * Month and day must be strings with two digits.
   * Both months and days are 1 indexed (JAN = '01' and 1 = '01').
   */
  dateDSTon = {
    year: now.getFullYear(),
    month: '05',
    day: '01'
  };
  dateDSToff = {
    year: now.getFullYear(),
    month: '11',
    day: '01'
  };

  // DST ON.
  date = dateWithTimezone(
    parseInt(dateDSTon.year),
    parseInt(dateDSTon.month) - 1,
    parseInt(dateDSTon.day),
    0, 0, 0,
    timezone
  );
  expectedDate = dateDSTon.year + '-' + dateDSTon.month + '-' + dateDSTon.day + 'T00:00:00+03:00';
  assert(
    Utilities.formatDate(date, timezone, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') === expectedDate,
    'DST ON check FAILED. This could be caused by a change in Google\'s date implementation which broke dateWithTimezone() or by a change in DST policy for \'Europe/Athens\'.'
  );

  // DST OFF.
  date = dateWithTimezone(
    parseInt(dateDSToff.year),
    parseInt(dateDSToff.month) - 1,
    parseInt(dateDSToff.day),
    0, 0, 0,
    timezone
  );
  expectedDate = dateDSToff.year + '-' + dateDSToff.month + '-' + dateDSToff.day + 'T00:00:00+02:00';
  assert(
    Utilities.formatDate(date, timezone, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') === expectedDate,
    'DST OFF check FAILED. This could be caused by a change in Google\'s date implementation which broke dateWithTimezone() or by a change in DST policy for \'Europe/Athens\'.'
  );
}

/**
 * Test all events from the selected period. After running you'll get combined email for all days (for testing subjects and HTML view) and second mail with logs (for testing text view).
 *
 * **NB:** Execution of this function very often exceeds maximum time (5min - 300s), so it's good idea to split it up into few runs (for me running it for 185 days works perfectly).
 *
 * @param {Date} [testDate=01/01/CURRENT_YEAR] - First date to test.
 * @param {number} [numberOfDaysToTest=365] - Number of days to test.
 */
function testSelectedPeriod (testDate, numberOfDaysToTest) { // eslint-disable-line no-unused-vars
  testDate = testDate || new Date(new Date().getFullYear(), 0, 1, 6, 0, 0);
  numberOfDaysToTest = numberOfDaysToTest || 365;

  log.add('testSelectedPeriod() running checking from ' + testDate.toDateString() + ' for ' + numberOfDaysToTest + ' days.', Priority.INFO);

  var emailData = {
    'subject': 'testSelectedPeriod run from ' + testDate.toDateString() + ' for ' + numberOfDaysToTest + ' days',
    'body': '',
    'htmlBody': ''
  };

  validateSettings();

  for (var i = 0; i < numberOfDaysToTest; i++) {
    var dayMailContent = generateEmailNotification(testDate);

    if (dayMailContent !== null) {
      log.add('Subject: ' + dayMailContent.subject);
      log.add('Content: ' + dayMailContent.body);

      emailData.body += '\n' + dayMailContent.subject + '\n';
      emailData.body += dayMailContent.body;

      emailData.htmlBody += '<h1>' + dayMailContent.subject + '</h1>';
      emailData.htmlBody += dayMailContent.htmlBody;
    }

    testDate = testDate.addDays(1);
  }

  MailApp.sendEmail({
    to: settings.user.notificationEmail,
    subject: emailData.subject,
    body: emailData.body,
    htmlBody: emailData.htmlBody,
    name: settings.user.emailSenderName
  });

  log.add('Test finished. Sending logs via email.', Priority.MAX);
  log.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
}
