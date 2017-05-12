// Thanks to this script you are going to receive an email before the birthday of each of your contacts.
// The script is easily customizable via some variables listed below.

// START MANDATORY CUSTOMIZATION

// You need to personalize these values, otherwise the script won't work.

// First of all, the script needs to know your email address (Notifications will be sent to this address).
var myEmail = 'insertyouremailhere@gmail.com';

/*
 * Open up https://calendar.google.com, in the menu on the left click on the arrow next to the birthday calendar
 * and choose 'Calendar settings', finally look for a the "Calendar ID field" (it should be something similar to
 * #contacts@group.v.calendar.google.com): copy and paste it between the quotes in the next line.
 */
var calendarId = '#contacts@group.v.calendar.google.com';

/*
 * If you need to adjust the timezone of the email notifications use this variable.
 * Accepted values:
 *  GMT/UTC - examples: 'UTC+2' 'GMT-4'
 *  regional timezones: 'Europe/Berlin' (See here for a complete list: http://joda-time.sourceforge.net/timezones.html)
 */
var myTimeZone = 'Europe/Rome';

// Specify at which hour of the day would you like to receive the email notifications (Insert a number from 0 to 23).
var notificationHour = 6;

// Here you must specify when you want to receive the email notification.
// Enter between the square brackets a comma-separated list of numbers, where each number represents how many day before
// a birthday you want to be notified. If you want to be notified only once then enter a single number between the brackets.
// Examples:
//  [0] means "Notify me the day of the birthday";
//  [0, 7] means "Notify me the day of the birthday and 7 days before";
//  [0, 1, 7] means "Notify me the day of the birthday, the day before and 7 days before";
// Note: in any case you will receive maximum one email per day: notification will be grouped in that email.
var anticipateDays = [0, 1, 7];

// For places where an indent is used for display reasons (in plaintext email), this number of spaces is used.
var indentSize = 4;

// When debugging and you want the logs emailed too, set this to true.
var sendLog = false;

// END MANDATORY CUSTOMIZATION

// There is no need to edit anything below this line: the script will work if you inserted valid values up until here, however feel free to take a peek at my code ;)
// If you want to translate the email notifications look for lines with this comment: // TRANSLATE HERE.

if (typeof Array.prototype.extend === "undefined") {
  Array.prototype.extend = function (array) {
    var i;

    for (i = 0; i < array.length; ++i) {
      this.push(array[i]);
    };
    return this;
  };
}

if (typeof String.prototype.format === "undefined") {
  String.prototype.format = function () {
    var args;

    args = arguments;
    return this.replace(/\{(\d+)\}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var indent = Array(indentSize + 1).join(' ');
var calendar = CalendarApp.getCalendarById(calendarId);
var calendarTimeZone = calendar.getTimeZone();

function getContactContent(event, now, timeInterval) {
  var eventData = event.gadget.preferences;
  var contactId = eventData['goo.contactsContactId'];
  var fullName = (typeof eventData['goo.contactsFullName'] === 'undefined') ? '' : eventData['goo.contactsFullName'];
  var email = (typeof eventData['goo.contactsEmail'] === 'undefined') ? '' : eventData['goo.contactsEmail'];
  var contact = ContactsApp.getContactById('http://www.google.com/m8/feeds/contacts/' + encodeURIComponent(myEmail) + '/base/' + contactId);
  line = [];
  if (email !== '') {
    Logger.log('Has email.');
  }
  if (fullName !== '') {
    Logger.log('Has full name');
    line.push(fullName);
  } else if (email !== '') {
    line.push('&lt;', email, '&gt;');
  } else {
    Logger.log('Has no email or full name');
    line.push('&lt;', 'UNKNOWN', '&gt;'); // TRANSLATE HERE
  }
  // If the contact's birthday does have the year.
  if (contact.getDates(ContactsApp.Field.BIRTHDAY)[0]) {
    Logger.log('Has birthday year.');
    // For example the age of the contact.
    currentYear = Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, 'yyyy');
    birthdayYear = contact.getDates(ContactsApp.Field.BIRTHDAY)[0].getYear();
    line.push(' - Age: ', (birthdayYear !== '' ? (currentYear - birthdayYear).toFixed(0) : 'UNKNOWN'); // TRANSLATE HERE
  }
  var contactPhones = contact.getPhones();
  if (email !== '' || contactPhones.length > 0) {
    line.push(' (');
    if (email !== '') {
      Logger.log('Has email.');
      line.push(email);
    }
    if (contactPhones.length > 0) {
      Logger.log('Has phone.');
      contactPhones.forEach(
        function(phoneField) {
          var phoneLabel = phoneField.getLabel();
          if (phoneLabel !== '') {
            line.push(' - [', phoneLabel, '] ');
          }
          line.push(phoneField.getPhoneNumber());
        }
      );
    }
    line.push(')');
  }
  return [fullName, line];
}

function checkBirthdays (testDate) {
  // The script needs this value in milliseconds while it was given in days.
  var anticipate = anticipateDays.map(function (n) { return 1000 * 60 * 60 * 24 * n; });

  // Verify that the birthday calendar exists.
  if (!calendar) {
    Logger.log('Error: Birthday calendar not found!');
    Logger.log('Please follow the instructions at this page to activate it: https://support.google.com/calendar/answer/6084659?hl=en');
    return;
  }

  // Email notification text.
  var subjectPrefix = 'Birthday: '; // TRANSLATE HERE
  var subjectBuilder = [];
  var bodyPrefix = 'Hey! Don\'t forget these birthdays:'; // TRANSLATE HERE
  var bodySuffix1 = 'Google Calendar Contacts Birthday Notification'; // TRANSLATE HERE
  var bodySuffix2 = 'by Giorgio Bonvicini'; // TRANSLATE HERE
  var bodyBuilder = [];
  var htmlBodyBuilder = [];

  // Use the testDate if specified, otherwise use todays' date.
  var now = testDate || new Date();
  Logger.log('Date used: ' + now);

  // For each of the interval to check:
  anticipate.forEach(
    function (timeInterval) {
      // Set the filter (We don't want every event in the calendar, just those happening 'timeInterval' milliseconds after now).
      var optionalArgs = {
        // Filter only events happening between 'now + timeInterval'...
        timeMin: Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        // ... and 'now + timeInterval + 1 sec'.
        timeMax: Utilities.formatDate(new Date(now.getTime() + timeInterval + 1000), calendarTimeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        // Treat recurring events as single events.
        singleEvents: true
      };
      Logger.log('Checking birthdays from ' + optionalArgs.timeMin + ' to ' + optionalArgs.timeMax);

      // Get all the matching events.
      var newBirthdays = Calendar.Events.list(calendarId, optionalArgs).items;
      Logger.log('Found ' + newBirthdays.length + ' birthdays in this time range.');

      // Get the correct formulation.
      if (newBirthdays.length > 0) {
        var date = Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, 'dd-MM-yyyy'); // TRANSLATE HERE (Date format)
        bodyBuilder.push(' * ');
        htmlBodyBuilder.push('<dt style="margin-left:0.8em;font-style:italic">');
        switch (timeInterval / (24 * 60 * 60 * 1000)) {
          case 0:
            bodyBuilder.push('Birthday today (' + date + '):\n'); // TRANSLATE HERE
            htmlBodyBuilder.push('Birthday today (' + date + '):</dt><dd style="margin-left:0.4em;padding-left:0"><ul style="list-style:none;margin-left:0;padding-left:0;">'); // TRANSLATE HERE
            break;
          case 1:
            bodyBuilder.push('Birthday tomorrow (' + date + '):\n'); // TRANSLATE HERE
            htmlBodyBuilder.push('Birthday tomorrow (' + date + '):</dt><dd style="margin-left:0.4em;padding-left:0"><ul style="list-style:none;margin-left:0;padding-left:0;">'); // TRANSLATE HERE
            break;
          default:
            bodyBuilder.push('Birthday in ' + timeInterval / (24 * 60 * 60 * 1000) + ' days (' + date + '):\n'); // TRANSLATE HERE
            htmlBodyBuilder.push('Birthday in ' + timeInterval / (24 * 60 * 60 * 1000) + ' days (' + date + '):</dt><dd style="margin-left:0.4em;padding-left:0"><ul style="list-style:none;margin-left:0;padding-left:0;">'); // TRANSLATE HERE
        }

        // Add each of the new birthdays for this timeInterval.
        newBirthdays.forEach(
          function (event, i) {
            Logger.log('Contact #' + i);
            var contactContent = getContactContent(event, now, timeInterval);
            subjectBuilder.push(contactContent[0]);
            bodyBuilder.push('\n', indent);
            bodyBuilder.extend(contactContent[1]);
            bodyBuilder.push('\n');
            htmlBodyBuilder.push('<li>');
            htmlBodyBuilder.extend(contactContent[1]);
            htmlBodyBuilder.push('</li>');
          }
        );

        bodyBuilder.push('\n');
        htmlBodyBuilder.push('</ul></dd>');
      }
    }
  );

  // If there is an email to send...
  if (bodyBuilder.length > 0) {
    var subject = subjectPrefix + subjectBuilder.join(' - ');
    var body = [bodyPrefix, '\n\n']
           .concat(bodyBuilder)
           .concat(['\n\n', indent, bodySuffix1, '\n', indent, bodySuffix2, '\n'])
           .join('');
    var htmlBody = ['<h3>', bodyPrefix, '</h3><dl>']
               .concat(htmlBodyBuilder)
               .concat(['</dl><hr/><p style="text-align:center;font-size:smaller"><a href="https://github.com/GioBonvi/GoogleCalendarBirthdayNotifications">', bodySuffix1, '</a><br/>', bodySuffix2, '</p>'])
               .join('');

    // ...send the email notification.
    Logger.log('Sending email...');
    MailApp.sendEmail({
      to: myEmail,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
    });
    Logger.log('Email sent.');
  }
  if (sendLog) {
    MailApp.sendEmail({
      to: myEmail,
      subject: 'Logs for birthday-notification run',
      body: Logger.getLog(),
    });
  }
}

// Start the notifications.
function start () {
  stop();
  ScriptApp.newTrigger('normal')
  .timeBased()
  .atHour(notificationHour)
  .everyDays(1)
  .inTimezone(myTimeZone)
  .create();
}

// Stop the notifications
function stop () {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

// Normal function call.
function normal() {
  checkBirthdays();
}

/*
 * Use this function to test the script. Insert a meaningful date below and
 * click "Run"->"test" in the menu at the top.
 */
function test () {
  // Date format: YEAR/MONTH/DAY
  // Insert here a date you want to test. Choose a date you know should trigger a birthday notification.
  var testDate = new Date('2017/01/01');
  Logger.log('Testing.');
  Logger.log('Test date: ' + testDate);
  checkBirthdays(testDate);
}
