/* global Logger CalendarApp ScriptApp ContactsApp Utilities Calendar UrlFetchApp MailApp */

// Thanks to this script you are going to receive an email before the birthday of each of your contacts.
// The script is easily customizable via some variables listed below.

// START MANDATORY CUSTOMIZATION

// You need to personalize these values, otherwise the script won't work.

// First of all specify the gmail address of your Google Account.
// This is needed to retrieve informations about your contacts.
var myGoogleEmail = 'insertyourgoogleemailhere@gmail.com';

// Now specify to which email address the notifications should be sent.
// This can be the same email address of the previous line or any other email address.
var myEmail = 'insertyouremailhere@someemail.com';

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

// For internationalization (translation) enter the two-digit lang-code here (to add your language just fill in the
// 'i18n' hash below and change lang here to match that).
var lang = 'en';

// END MANDATORY CUSTOMIZATION

// START DEBUGGING OPTIONS

// When debugging is not wanted you can set this true to disable debugging calls, for a slight speedup.
var noLog = false;

// When debugging (noLog == false) and you want the logs emailed too, set this to true.
var sendLog = false;

// The test() function can be run on a specified date as if it is "today". Specify that date here in the format
// YEAR/MONTH/DAY HOUR:MINUTE:SECOND. Choose a date you know should trigger a birthday notification.
var fakeTestDate = '2017/01/01 06:00:00';

// END DEBUGGING OPTIONS

// There is no need to edit anything below this line: the script will work if you inserted valid values up until here, however feel free to take a peek at my code ;)

var version = '2.1';

if (typeof Array.prototype.extend === 'undefined') {
  Array.prototype.extend = function (array) {
    var i;

    for (i = 0; i < array.length; ++i) {
      this.push(array[i]);
    }
    return this;
  };
}

if (typeof String.prototype.format === 'undefined') {
  String.prototype.format = function () {
    var args;

    args = arguments;
    return this.replace(/\{(\d+)\}/g, function (match, number) {
      return typeof args[number] !== 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var indent = Array(indentSize + 1).join(' ');
var i18n = {
  // For all languages, if a translation is not present the untranslated string
  // is returned, so just leave out translations which are the same as the English.

  // An entry for 'en' marks it as a valid lang config-option, but leave it empty
  // to just return unaltered phrases.
  'en': {},
  'el': {
    'UNKNOWN': 'ΑΓΝΩΣΤΟ',
    'Age': 'Ηλικία',
    'Birthday': 'Γενέθλια',
    'Birthday today': 'Γενέθλια σήμερα',
    'Birthday tomorrow': 'Γενέθλια αύριο',
    'Birthday in {0} days': 'Γενέθλια σε {0} ημέρες',
    'Hey! Don\'t forget these birthdays': 'Μην ξεχάσετε αυτά τα γενέθλια',
    'Google Calendar Contacts Birthday Notification': 'Ενημερώσεις Γενεθλίων του Ημερολογίου Google',
    'version': 'εκδοχή',
    'by': 'από τον', // τον=masculine,την=feminine (using the masculine, in one place, for now but may need more context in future)
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'send email now': 'στείλτε email τώρα',
    'Mobile phone': 'Κινητό',
    'Work phone': 'Τηλέφωνο εργασίας',
    'Home phone': 'Τηλέφωνο οικίας',
    'Main phone': 'Κύριο τηλέφωνο',
  },
  'it': {
    'UNKNOWN': 'SCONOSCIUTO',
    'Age': 'Età',
    'Birthday': 'Compleanno',
    'Birthday today': 'Compleanno oggi',
    'Birthday tomorrow': 'Compleanno domani',
    'Birthday in {0} days': 'Compleanno fra {0} giorni',
    'Hey! Don\'t forget these birthdays': 'Hey! Non dimenticare questi compleanni',
    'version': 'versione',
    'by': 'by',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'send email now': 'invia email ora',
    'Mobile phone': 'Cellulare',
    'Work phone': 'Telefono di lavoro',
    'Home phone': 'Telefono di casa',
    'Main phone': 'Telefono principale',
  },
  /* To add a language:
  '[lang-code]': {
    '[first phrase]': '[translation here]',
    '[second phrase]': '[translation here]',
    ...
  }
  */
};

var calendar = CalendarApp.getCalendarById(calendarId);
var calendarTimeZone = calendar ? calendar.getTimeZone() : null;
var inlineImages;

function beautifyLabel (label) {
  switch (label) {
    case ContactsApp.Field.MOBILE_PHONE:
      return _('Mobile phone');
    case ContactsApp.Field.WORK_PHONE:
      return _('Work phone');
    case ContactsApp.Field.HOME_PHONE:
      return _('Home phone');
    case ContactsApp.Field.MAIN_PHONE:
      return _('Main phone');
    default:
      return label;
  }
}

function _ (string) {
  return i18n[lang][string] || string;
}

function doLog (arg) {
  noLog || Logger.log(arg);
}

function checkBirthdays (testDate) {
  var anticipate, subjectPrefix, subjectBuilder,
    bodyPrefix, bodySuffix1, bodySuffix2, bodyBuilder, htmlBodyBuilder, now, subject, body, htmlBody;

  doLog('Starting run of GoogleCalendarBirthdayNotifications version ' + version + '.');
  // The script needs this value in milliseconds while it was given in days.
  anticipate = anticipateDays.map(function (n) { return 1000 * 60 * 60 * 24 * n; });
  // Verify that the birthday calendar exists.
  if (!calendar) {
    doLog('Error: Birthday calendar not found!');
    doLog('Please follow the instructions at this page to activate it: https://support.google.com/calendar/answer/6084659?hl=en');
    return;
  }

  // Email notification text.
  subjectPrefix = _('Birthday') + ': ';
  subjectBuilder = [];
  bodyPrefix = _('Hey! Don\'t forget these birthdays') + ':';
  bodySuffix1 = _('Google Calendar Contacts Birthday Notification') + ' (' + _('version') + ' ' + version + ')';
  bodySuffix2 = _('by ') + 'Giorgio Bonvicini';
  bodyBuilder = [];
  htmlBodyBuilder = [];

  // Use the testDate if specified, otherwise use todays' date.
  now = testDate || new Date();
  doLog('Date used: ' + now);

  inlineImages = {};
  // For each of the interval to check:
  anticipate.forEach(
    function (timeInterval) {
      var optionalArgs, newBirthdays, date, whenIsIt;

      // Set the filter (We don't want every event in the calendar, just those happening 'timeInterval' milliseconds after now).
      optionalArgs = {
        // Filter only events happening between 'now + timeInterval'...
        timeMin: Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        // ... and 'now + timeInterval + 1 sec'.
        timeMax: Utilities.formatDate(new Date(now.getTime() + timeInterval + 1000), calendarTimeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        // Treat recurring events as single events.
        singleEvents: true
      };
      doLog('Checking birthdays from ' + optionalArgs.timeMin + ' to ' + optionalArgs.timeMax);

      // Get all the matching events.
      newBirthdays = Calendar.Events.list(calendarId, optionalArgs).items;
      doLog('Found ' + newBirthdays.length + ' birthdays in this time range.');
      // Get the correct formulation.
      if (newBirthdays.length < 1) {
        return;
      }
      date = Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, _('dd-MM-yyyy'));
      bodyBuilder.push(' * ');
      htmlBodyBuilder.push('<dt style="margin-left:0.8em;font-style:italic">');
      switch (timeInterval / (24 * 60 * 60 * 1000)) {
        case 0:
          whenIsIt = _('Birthday today') + ' (' + date + ')';
          break;
        case 1:
          whenIsIt = _('Birthday tomorrow') + ' (' + date + ')';
          break;
        default:
          whenIsIt = _('Birthday in {0} days').format(timeInterval / (24 * 60 * 60 * 1000)) + ' (' + date + ')';
      }
      bodyBuilder.push(whenIsIt, ':\n');
      htmlBodyBuilder.push(whenIsIt, '</dt><dd style="margin-left:0.4em;padding-left:0"><ul style="list-style:none;margin-left:0;padding-left:0;">');
      // Add each of the new birthdays for this timeInterval.
      newBirthdays.forEach(
        function (event, i) {
          var contact;

          doLog('Contact #' + i);
          contact = new Contact(event);
          subjectBuilder.push(contact.fullName);
          bodyBuilder.extend(contact.getPlainTextLine());
          htmlBodyBuilder.extend(contact.getHtmlLine());
        }
      );

      bodyBuilder.push('\n');
      htmlBodyBuilder.push('</ul></dd>');
    }
  );

  // If there is an email to send...
  if (bodyBuilder.length > 0) {
    subject = subjectPrefix + subjectBuilder.join(' - ');
    body = [bodyPrefix, '\n\n']
           .concat(bodyBuilder)
           .concat(['\n\n', indent, bodySuffix1, '\n', indent, bodySuffix2, '\n'])
           .join('');
    htmlBody = ['<h3>', bodyPrefix, '</h3><dl>']
               .concat(htmlBodyBuilder)
               .concat(['</dl><hr/><p style="text-align:center;font-size:smaller"><a href="https://github.com/GioBonvi/GoogleCalendarBirthdayNotifications">', bodySuffix1, '</a><br/>', bodySuffix2, '</p>'])
               .join('');

    // ...send the email notification.
    doLog('Sending email...');
    MailApp.sendEmail({
      to: myEmail,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
      inlineImages: inlineImages
    });
    doLog('Email sent.');
  }
  if (!noLog && sendLog) {
    MailApp.sendEmail({
      to: myEmail,
      subject: 'Logs for birthday-notification run',
      body: Logger.getLog()
    });
  }
}

var Contact = function (event) {
  var eventData, contact, currentYear, birthdayYear, phoneFields;

  eventData = event.gadget.preferences;
  this.id = (typeof eventData['goo.contactsContactId'] === 'undefined') ? '' : eventData['goo.contactsContactId'];
  this.fullName = (typeof eventData['goo.contactsFullName'] === 'undefined') ? '' : eventData['goo.contactsFullName'];
  this.email = (typeof eventData['goo.contactsEmail'] === 'undefined') ? '' : eventData['goo.contactsEmail'];
  this.photo = (typeof eventData['goo.contactsPhotoUrl'] === 'undefined') ? '' : eventData['goo.contactsPhotoUrl'];
  this.age = '';
  this.phoneFields = [];
  if (this.email !== '') {
    doLog('Has email.');
  }
  if (this.fullName !== '') {
    doLog('Has full name');
  }
  if (this.photo !== '') {
    doLog('Has photo.');
  }


  contact = ContactsApp.getContactById('http://www.google.com/m8/feeds/contacts/' + encodeURIComponent(myGoogleEmail) + '/base/' + this.id);
  if (contact) {
    // If the contact's birthday does have the year.
    if (contact.getDates(ContactsApp.Field.BIRTHDAY)[0]) {
      doLog('Has birthday year.');
      currentYear = Utilities.formatDate(new Date(event.start.date.replace(/-/g, '/')), calendarTimeZone, 'yyyy');
      birthdayYear = contact.getDates(ContactsApp.Field.BIRTHDAY)[0].getYear();
      this.age = birthdayYear !== '' ? (currentYear - birthdayYear).toFixed(0) : '';
    }
    phoneFields = contact.getPhones();
    if (phoneFields.length > 0) {
      this.phoneFields = phoneFields;
      doLog('Has phones.');
    }
  }

  this.getPlainTextLine = function () {
    var line;

    line = [];
    line.push('\n', indent, this.fullName);
    if (this.age !== '') {
      line.push(' - ', _('Age'), ': ', this.age);
    }
    if (this.email !== '' || typeof this.phoneFields !== 'undefined') {
      line.push(' (');
      if (this.email !== '') {
        line.push(this.email);
      }
      this.phoneFields.forEach(function (phoneField, i) {
        var label;

        if (i !== 0 || this.email !== '') {
          line.push(' - ');
        }
        label = phoneField.getLabel();
        if (label !== '') {
          line.push('[', beautifyLabel(label), '] ');
        }
        line.push(phoneField.getPhoneNumber());
      });
      line.push(')');
    }
    line.push('\n');
    return line;
  };

  this.getHtmlLine = function () {
    var line, imgCount;

    line = [];

    line.push('<li>');
    if (this.photo !== '') {
      imgCount = Object.keys(inlineImages).length;
      inlineImages['contact-img-' + imgCount] = UrlFetchApp.fetch(this.photo).getBlob().setName('contact-img-' + imgCount);
      line.push('<img src="cid:contact-img-' + imgCount + '" style="height:1.4em;margin-right:0.4em" />');
    }
    line.push(this.fullName);
    if (this.age !== '') {
      line.push(' - ', _('Age'), ': ', this.age);
    }
    if (this.email !== '' || typeof this.phoneFields !== 'undefined') {
      line.push(' (');
      if (this.email !== '') {
        line.push(this.email);
      }
      this.phoneFields.forEach(function (phoneField, i) {
        var label;

        if (i !== 0 || this.email !== '') {
          line.push(' - ');
        }
        label = phoneField.getLabel();
        if (label !== '') {
          line.push('[', beautifyLabel(label), '] ');
        }
        line.push('<a href="tel:', phoneField.getPhoneNumber(), '">', phoneField.getPhoneNumber(), '</a>');
      });
      line.push(')');
    }

    if (this.email !== '') {
      line.push(' <a href="mailto:', this.email, '">', _('send email now'), '</a>');
    }

    return line;
  };
};

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

// Stop the notifications.
function stop () {
  var triggers;

  triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

// Check if notifications are running.
function status () {
  var toLog = 'Notifications are';

  if (ScriptApp.getProjectTriggers().length < 1) {
    toLog += ' not';
  }
  toLog += ' running.';
  Logger.log(toLog);
  if (!noLog && sendLog) {
    MailApp.sendEmail({
      to: myEmail,
      subject: 'Status for birthday-notification',
      body: Logger.getLog()
    });
  }
}

// Normal function call.
function normal () {
  checkBirthdays();
}

/*
 * Use this function to test the script. Edit the date in the debugging
 * configuration above and click "Run"->"test" in the menu at the top
 * of the Google script interface.
 */
function test () {
  var testDate;

  testDate = new Date(fakeTestDate);
  doLog('Testing.');
  doLog('Test date: ' + testDate);
  checkBirthdays(testDate);
}
