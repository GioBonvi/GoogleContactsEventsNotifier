// Thanks to this script you are going to receive an email before the birthday of each of your contacts.
// The script is easily customizable via some variables listed below.

// START MANDATORY CUSTOMIZATION

// You need to personalize these values, otherwise the script won't work.

// First of all, the script needs to know your email address (Notifications will be sent to this address).
var myEmail = 'insertyouremailhere@gmail.com';

// If you need to adjust the timezone of the email notifications use this variable.
/*
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

// END MANDATORY CUSTOMIZATION

// There is no need to edit anything below this line: the script will work if you inserted valid values up until here, however feel free to take a peek at my code ;)
// If you want to translate the email notifications look for lines with this comment: // TRANSLATE HERE.

function checkBirthdays (testDate) {
  // The script needs this value in milliseconds while it was given in days.
  var anticipate = anticipateDays.map(function (n) { return 1000 * 60 * 60 * 24 * n; });

  // Unique ID of the calendar containing birthdays.
  var calendarId = '#contacts@group.v.calendar.google.com';

  // Verify that the birthday calendar exists.
  if (!CalendarApp.getCalendarById(calendarId)) {
    Logger.log('Error: Birthday calendar not found!');
    Logger.log('Please follow the instructions at this page to activate it: https://support.google.com/calendar/answer/6084659?hl=en');
    return;
  }

  // Set timezone.
  var calendarTimeZone = CalendarApp.getCalendarById(calendarId).getTimeZone();

  // Email notification text.
  var subjectPrefix = 'Birthday: '; // TRANSLATE HERE
  var subjectBuilder = [];
  var bodyPrefix = '<p>Hey! Don\'t forget these birthdays:</p>'; // TRANSLATE HERE
  var bodyBuilder = [];
  var bodySuffix = '<br><br><p><center>Google Calendar Contacts Birthday Notification<br>by Giorgio Bonvicini<center></p>'; // TRANSLATE HERE

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
        switch (timeInterval / (24 * 60 * 60 * 1000)) {
          case 0:
            bodyBuilder.push('<p>Birthday today (' + date + '):</p><ul>'); // TRANSLATE HERE
            break;
          case 1:
            bodyBuilder.push('<p>Birthday tomorrow (' + date + '):</p><ul>'); // TRANSLATE HERE
            break;
          default:
            bodyBuilder.push('<p>Birthday in ' + timeInterval / (24 * 60 * 60 * 1000) + ' days (' + date + '):</p><ul>'); // TRANSLATE HERE
        }

        // Add each of the new birthdays for this timeInterval.
        newBirthdays.forEach(
          function (event, i) {
            Logger.log('Contact #' + i);
            var eventData = event.gadget.preferences;
            var line = ['<li>', eventData['goo.contactsFullName']];
            var email = (typeof eventData['goo.contactsEmail'] === 'undefined') ? '' : eventData['goo.contactsEmail'];
            if (email !== '') {
              Logger.log('Has email.');
              // If the contact has an email we can retrieve some more information.
              var contact = ContactsApp.getContact(eventData['goo.contactsEmail']);

              // If the contact's birthday does have the year.
              if (contact.getDates(ContactsApp.Field.BIRTHDAY)[0]) {
                Logger.log('Has birthday year.');
                // For example the age of the contact.
                var currentYear = Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, 'yyyy');
                var birthdayYear = contact.getDates(ContactsApp.Field.BIRTHDAY)[0].getYear();
                var age = (currentYear - birthdayYear).toFixed(0);
                line.push(' - Age: ', age); // TRANSLATE HERE
              }

              // Or the email itself.
              line.push(' (', email);

              // And even the mobile phone number if specified.
              if (contact.getPhones().length > 0) {
                Logger.log('Has phone.');
                contact.getPhones().forEach(
                  function (phoneField) {
                    line.push(' - ');
                    if (phoneField.getLabel() !== '') {
                      line.push('[', phoneField.getLabel(), '] ');
                    }
                    line.push(phoneField.getPhoneNumber());
                  }
                );
              }

              line.push(')');
            }
            line.push('</li>');
            subjectBuilder.push(eventData['goo.contactsFullName']);
            bodyBuilder.push(line.join(''));
          }
        );

        bodyBuilder.push('</ul>');
      }
    }
  );

  // If there is an email to send...
  if (bodyBuilder.length > 0) {
    var subject = subjectPrefix + subjectBuilder.join(' - ');
    var body = bodyPrefix + bodyBuilder.join('') + bodySuffix;

    // ...send the email notification.
    Logger.log('Sending email...');
    MailApp.sendEmail(
      myEmail,
      subject,
      body,
      {
        htmlBody: body
      }
    );
    Logger.log('Email sent.');
  }
}

// Start the notifications.
function start () {
  stop();
  ScriptApp.newTrigger('checkBirthdays')
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
