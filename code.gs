/* global Logger CalendarApp ScriptApp ContactsApp Utilities Calendar UrlFetchApp MailApp */

/*
 * Thanks to this script you are going to receive an email before events of each of your contacts.
 * The script is easily customizable via some variables listed below.
 */

// START MANDATORY CUSTOMIZATION

// You need to personalize these values, otherwise the script won't work.

/*
 * GOOGLE EMAIL ADDRESS
 *
 * First of all specify the Gmail address of your Google Account.
 * This is needed to retrieve information about your contacts.
 */
var myGoogleEmail = 'insertyourgoogleemailhere@gmail.com';

/*
 * NOTIFICATION EMAIL ADDRESS
 *
 * Now specify to which email address the notifications should be sent.
 * This can be the same email address of the previous line or any other email address.
 */
var myEmail = 'insertyouremailhere@someemail.com';

/*
 * ID OF THE CONTACTS EVENTS CALENDAR
 *
 * Open up https://calendar.google.com, in the menu on the left click on the arrow next to the contacts events
 * calendar (which should have a default name like 'Birthdays and events') and choose 'Calendar settings',
 * finally look for the "Calendar ID field" (it should be something similar to
 * #contacts@group.v.calendar.google.com): copy and paste it between the quotes in the next line.
 */
var calendarId = '#contacts@group.v.calendar.google.com';

// END MANDATORY CUSTOMIZATION

// START OPTIONAL CUSTOMIZATION

// It is a good idea to edit these options to adapt the script to your needs,
// however you can just leave the default values and the script will work fine.

/*
 * EMAIL SENDER NAME
 *
 * This is the name you will see as the sender of the email.
 * If you leave it blank it will default to your Google account name.
 * Note: this may not work when using a Gmail address sending emails to itself.
 */
var emailSenderName = 'Contacts Events Notifications';

/*
 * YOUR TIMEZONE
 *
 * If you need to adjust the timezone of the email notifications use this variable.
 *
 * Accepted values:
 *  GMT - examples: 'GMT-4'
 *  regional timezones: 'Europe/Berlin' (See here for a complete list: http://joda-time.sourceforge.net/timezones.html)
 */
var myTimeZone = 'Europe/Rome';

/*
 * HOUR OF THE NOTIFICATION
 *
 * Specify at which hour of the day would you like to receive the email notifications.
 * This must be a number between 0 and 23.
 */
var notificationHour = 6;

/*
 * HOW MANY DAYS BEFORE EVENT
 *
 * Here you have to decide when you want to receive the email notification.
 * Insert between the square brackets a comma-separated list of numbers, where each number
 * represents how many days before an event you want to be notified.
 * If you want to be notified only once then enter a single number between the brackets.
 *
 * Examples:
 *  [0] means "Notify me the day of the event";
 *  [0, 7] means "Notify me the day of the event and 7 days before";
 *  [0, 1, 7] means "Notify me the day of the event, the day before and 7 days before";
 *
 * Note: in any case you will receive one email per day: all the notifications will be grouped
 * together in that email.
 */
var anticipateDays = [0, 1, 7];

/*
 * LANGUAGE
 *
 * For internationalization (translation) enter the two-digit lang-code here (to add your language just fill in the
 * 'i18n' hash below and change lang here to match that).
 */
var lang = 'en';

/*
 * TYPE OF EVENTS
 *
 * This script can track any Google Contact Event: you can decide which one by placing true or false next to each type.
 * By default the script only tracks birthday events.
 */

var eventTypes = {
  BIRTHDAY: true,
  ANNIVERSARY: false,
  CUSTOM: false
};

// For places where an indent is used for display reasons (in plaintext email), this number of spaces is used.
var indentSize = 4;

// END OPTIONAL CUSTOMIZATION

// START DEBUGGING OPTIONS

// When debugging is not wanted you can set this true to disable debugging calls, for a slight speedup.
var noLog = false;

// When debugging (noLog == false) and you want the logs emailed too, set this to true.
var sendLog = false;

/*
 * The test() function can be run on a specified date as if it is "today". Specify that date here in the format
 * YEAR/MONTH/DAY HOUR:MINUTE:SECOND
 * Choose a date you know should trigger an event notification.
 */
var fakeTestDate = '2017/02/14 06:00:00';

// END DEBUGGING OPTIONS

/*
 * There is no need to edit anything below this line.
 * The script will work if you inserted valid values up until here, however feel free to take a peek at my code ;)
 */

 /*
 * The version of the script.
 * It must be a valid SimplifiedSemanticVersion.
 */
var version = new SimplifiedSemanticVersion('3.1.0');

// These URsL are used to access the files in the repository or specific pages on GitHub.
var baseRawFilesURL = 'https://raw.githubusercontent.com/GioBonvi/GoogleContactsEventsNotifier/master/';
var baseGitHubProjectURL = 'https://github.com/GioBonvi/GoogleContactsEventsNotifier/';

// Merge an array at the end of an existing array.
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

// Convert user-configured hash to an array
eventTypes = Object.keys(eventTypes).filter(function (x) { return eventTypes[x]; });

var indent = Array(indentSize + 1).join(' ');

var i18n = {
  // For all languages, if a translation is not present the untranslated string
  // is returned, so just leave out translations which are the same as the English.

  // An entry for 'en' marks it as a valid lang config-option, but leave it empty
  // to just return unaltered phrases.
  'en': {},
  'el': {
    'Age': 'Ηλικία',
    'Years': 'Χρόνια',
    'Events': 'Γεγονότα',
    'Birthdays today': 'Γενέθλια σήμερα',
    'Birthdays tomorrow': 'Γενέθλια αύριο',
    'Birthdays in {0} days': 'Γενέθλια σε {0} ημέρες',
    'Anniversaries today': 'Επέτειοι σήμερα',
    'Anniversaries tomorrow': 'Επέτειοι αύριο',
    'Anniversaries in {0} days': 'Επέτειοι σε {0} ημέρες',
    'Custom events today': 'Προσαρμοσμένα γεγονότα σήμερα',
    'Custom events tomorrow': 'Προσαρμοσμένα γεγονότα αύριο',
    'Custom events in {0} days': 'Προσαρμοσμένα γεγονότα σε {0} ημέρες',
    'Hey! Don\'t forget these events': 'Hey! Μην ξεχάσεις αυτά τα γεγονότα',
    'version': 'εκδοχή',
    'by': 'από τον', // τον=masculine,την=feminine (using the masculine, in one place, for now but may need more context in future)
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Κινητό',
    'Work phone': 'Τηλέφωνο εργασίας',
    'Home phone': 'Τηλέφωνο οικίας',
    'Main phone': 'Κύριο τηλέφωνο',
    // TODO: 'It looks like you are using an outdated version of this script': '',
    // TODO: 'You can find the latest one here': '',
  },
  'es': {
    'Age': 'Edad',
    'Years': 'Años',
    'Events': 'Eventos',
    'Birthdays today': 'Cumpleaños hoy',
    'Birthdays tomorrow': 'Cumpleaños mañana',
    'Birthdays in {0} days': 'Cumpleaños en {0} días',
    'Anniversaries today': 'Aniversarios hoy',
    'Anniversaries tomorrow': 'Aniversarios mañana',
    'Anniversaries in {0} days': 'Aniversarios en {0} días',
    'Custom events today': 'Eventos personalizados de hoy',
    'Custom events tomorrow': 'Eventos personalizados de mañana',
    'Custom events in {0} days': 'Eventos personalizados en {0} das',
    'Hey! Don\'t forget these events': 'Hey! No olvides estos eventos',
    'version': 'versión',
    'by': 'por',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Celular',
    'Work phone': 'Teléfono del trabajo',
    'Home phone': 'Teléfono del hogar',
    'Main phone': 'Teléfono principal',
    // TODO: 'It looks like you are using an outdated version of this script': '',
    // TODO: 'You can find the latest one here': '',
  },
  'it': {
    'Age': 'Età',
    'Years': 'Anni',
    'Events': 'Eventi',
    'Birthdays today': 'Compleanni oggi',
    'Birthdays tomorrow': 'Compleanni domani',
    'Birthdays in {0} days': 'Compleanni fra {0} giorni',
    'Anniversaries today': 'Anniversari oggi',
    'Anniversaries tomorrow': 'Anniversari domani',
    'Anniversaries in {0} days': 'Anniversari fra {0} giorni',
    'Custom events today': 'Eventi personalizzati oggi',
    'Custom events tomorrow': 'Eventi personalizzati domani',
    'Custom events in {0} days': 'Eventi personalizzati fra {0} giorni',
    'Hey! Don\'t forget these events': 'Hey! Non dimenticare questi eventi',
    'version': 'versione',
    'by': 'by',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Cellulare',
    'Work phone': 'Telefono di lavoro',
    'Home phone': 'Telefono di casa',
    'Main phone': 'Telefono principale',
    'It looks like you are using an outdated version of this script': 'Sembra che tu stia usando una vecchia versione di questo script',
    'You can find the latest one here': 'Puoi trovare l\'ultima qui',
  },
  'id': {
    'Age': 'Usia',
    'Years': 'Tahun-tahun',
    'Events': 'Peristiwa-peristiwa',
    'Birthdays today': 'Ulang tahun hari ini',
    'Birthdays tomorrow': 'Ulang tahun besok',
    'Birthdays in {0} days': 'Ulang tahun dalam {0} hari mendatang',
    'Anniversaries today': 'Hari jadi hari ini',
    'Anniversaries tomorrow': 'Hari jadi besok',
    'Anniversaries in {0} days': 'Hari jadi dalam {0} hari mendatang',
    'Custom events today': 'Peristiwa khusus hari ini',
    'Custom events tomorrow': 'Peristiwa khusus besok',
    'Custom events in {0} days': 'Peristiwa khusus dalam {0} hari mendatang',
    'Hey! Don\'t forget these events': 'Hai! Jangan lupa peristiwa-peristiwa berikut',
    'version': 'versi',
    'by': 'oleh',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telp. Selular',
    'Work phone': 'Telp. Kantor',
    'Home phone': 'Telp. Rumah',
    'Main phone': 'Telp. Utama',
    // TODO: 'It looks like you are using an outdated version of this script': '',
    // TODO: 'You can find the latest one here': '',
  },
  'de': {
    'Age': 'Alter',
    'Years': 'Jahre',
    'Events': 'Termine',
    'Birthdays today': 'Geburtstage heute',
    'Birthdays tomorrow': 'Geburtstage morgen',
    'Birthdays in {0} days': 'Geburtstage in {0} Tagen',
    'Anniversaries today': 'Jahrestage heute',
    'Anniversaries tomorrow': 'Jahrestage morgen',
    'Anniversaries in {0} days': 'Jahrestage in {0} Tagen',
    'Custom events today': 'Benutzerdefinierte Termine heute',
    'Custom events tomorrow': 'Benutzerdefinierte Termine morgen',
    'Custom events in {0} days': 'Benutzerdefinierte Termine in {0} Tagen',
    'Hey! Don\'t forget these events': 'Hey! Vergiss diese Termine nicht',
    'version': 'Version',
    'by': 'von',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobiltelefon',
    'Work phone': 'Geschäftlich',
    'Home phone': 'Privat',
    'Main phone': 'Hauptnummer',
    // TODO: 'It looks like you are using an outdated version of this script': '',
    // TODO: 'You can find the latest one here': '',
  },
  'pl': {
    'Age': 'Wiek',
    'Years': 'Lata',
    'Events': 'Wydarzenia',
    'Birthdays today': 'Urodziny dzisiaj',
    'Birthdays tomorrow': 'Urodziny jutro',
    'Birthdays in {0} days': 'Urodziny za {0} dni',
    'Anniversaries today': 'Rocznice dzisiaj',
    'Anniversaries tomorrow': 'Rocznice jutro',
    'Anniversaries in {0} days': 'Rocznice za {0} dni',
    'Custom events today': 'Inne wydarzenia dzisiaj',
    'Custom events tomorrow': 'Inne wydarzenia jutro',
    'Custom events in {0} days': 'Inne wydarzenia za {0} dni',
    'Hey! Don\'t forget these events': 'Hej! Nie zapomnij o tych datach',
    'version': 'wersja',
    'by': 'od',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telefon komórkowy',
    'Work phone': 'Telefon (praca)',
    'Home phone': 'Telefon (domowy)',
    'Main phone': 'Telefon (główny)',
    // TODO: 'It looks like you are using an outdated version of this script': '',
    // TODO: 'You can find the latest one here': '',
  },
  /* To add a language:
  '[lang-code]': {
    '[first phrase]': '[translation here]',
    '[second phrase]': '[translation here]',
    ...
  }
  */
};

var eventCalendar = CalendarApp.getCalendarById(calendarId);
var calendarTimeZone = eventCalendar ? eventCalendar.getTimeZone() : null;
var inlineImages;

function htmlEscape (str) {
  return str
         .replace(/&/g, '&amp;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/\//g, '&#x2F;');
}

function uniqueStrings (x) {
  var seen = {};
  return x.filter(function (str) {
    return seen.hasOwnProperty(str) ? false : (seen[str] = true);
  });
}

// Replace a Field.Label object with its "beautified" text representation.
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

// Get a a ContactsApp.Month's numerical representation (JAN = 0).
function monthToInt (month) {
  var i;
  var months = [
    ContactsApp.Month.JANUARY,
    ContactsApp.Month.FEBRUARY,
    ContactsApp.Month.MARCH,
    ContactsApp.Month.APRIL,
    ContactsApp.Month.MAY,
    ContactsApp.Month.JUNE,
    ContactsApp.Month.JULY,
    ContactsApp.Month.AUGUST,
    ContactsApp.Month.SEPTEMBER,
    ContactsApp.Month.OCTOBER,
    ContactsApp.Month.NOVEMBER,
    ContactsApp.Month.DECEMBER
  ];
  for (i = 0; i < 12; i++) {
    if (month === months[i]) {
      return i;
    }
  }
  return -1;
}

/*
 * An object representing a simplified semantic version number.
 * It must be composed of:
 *  - three dot-separated positive integers (major version,
 *    minor version and patch number);
 *  - optionally a pre-release identifier, prefixed by a hyphen;
 *  - optionally a metadata identifier, prefixed by a plus sign;
 * This differes from the official SemVer style because the pre-release
 * string is compared as a whole in version comparison instead of
 * being spliced into chuncks.
 * Valid examples:
 *  4.6.2, 3.12.234-alpha,  0.11.0+20170827, 2.0.0-beta+20170827
 */
function SimplifiedSemanticVersion (versionNumber) {
  var matches, self;

  self = this;
  this.numbers = [0, 0, 0];
  this.prerelease = '';
  this.metadata = '';

  matches = versionNumber.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+?))??(?:\+(.+))??$/);
  if (matches) {
    self.numbers[0] = window.parseInt(matches[1]);
    self.numbers[1] = window.parseInt(matches[2]);
    self.numbers[2] = window.parseInt(matches[3]);
    self.prerelease = typeof matches[4] === 'undefined' ? '' : matches[4];
    self.metadata = typeof matches[5] === 'undefined' ? '' : matches[5];
  } else {
    throw new Error('The version number "' + versionNumber + '" is not valid!');
  }
}

/*
 * Rebuild the version number string from the extracted data.
 */
SimplifiedSemanticVersion.prototype.toString = function () {
  return this.numbers.join('.') +
    (this.prerelease !== '' ? '-' + this.prerelease : '') +
    (this.metadata !== '' ? '-' + this.metadata : '');
};

/*
 * Compare a semantic version number with another one.
 *
 * Returns -1, 0 , 1 if this version number is smaller than,
 * equal to or bigger than the one passed as the parameter.
 *
 * Order of comparison: major number, minor number, patch number,
 * prerelease string (ASCII comparison). Metadata do not influence
 * comparisons.
 */
SimplifiedSemanticVersion.prototype.compare = function (comparedVersion) {
  var i;
  for (i = 0; i < 3; i++) {
    if (this.numbers[i] !== comparedVersion.numbers[i]) {
      return (this.numbers[i] < comparedVersion.numbers[i] ? -1 : 1);
    }
  }
  if (this.prerelease !== comparedVersion.prerelease) {
    // Between two version with the same numbers, one in pre-release and the other not
    // the one in pre-release must be considered smaller.
    if (this.prerelease === '') {
      return 1;
    } else if (comparedVersion.prerelease === '') {
      return -1;
    }
    return (this.prerelease < comparedVersion.prerelease ? -1 : 1);
  }
  return 0;
};

/*
 * Get the last version number from the GitHub file and compare it with the script's one.
 * If they do not match the user is running an outdated version of the script.
 * If there is any problem retrieving the latest version number just return false.
 */
function isRunningOutdatedVersion () {
  var response, latestVersion;

  response = UrlFetchApp.fetch(baseRawFilesURL + 'code.gs');
  if (response.getResponseCode() !== 200) {
    doLog('Unable to get the latest version number: the requested URL returned a ' + response.getResponseCode() + ' response.');
    return false;
  }

  latestVersion = /var version = new SimplifiedSemanticVersion\('(.+)'\);/.exec(response.getContentText('UTF-8'));
  if (latestVersion === null) {
    doLog('Unable to get the latest version number: the version number could not be found in the text file.');
    return false;
  }

  try {
    return (version).compare(new SimplifiedSemanticVersion(latestVersion)) === -1;
  } catch (err) {
    doLog(err.message);
    return false;
  }
}

/*
 * Get the translation of a string.
 * If the language or the chosen string is invalid return the string itself.
 */
function _ (string) {
  return i18n[lang][string] || string;
}

function doLog (arg) {
  noLog || Logger.log(arg);
}

/*
 * Look for events on a certain date.
 * If testDate is not specified Date.now() will be used.
 */
function checkEvents (testDate) {
  var anticipate, subjectPrefix, subjectBuilder,
    bodyPrefix, bodySuffix1, bodySuffix2, bodySuffix3, bodySuffix4, bodyBuilder, htmlBodyBuilder, now, subject, body, htmlBody;

  doLog('Starting run of Google Contacts Events Notifier version ' + version.toString() + '.');
  // The script needs this value in milliseconds, but the user entered it in days.
  anticipate = anticipateDays.map(function (n) { return 1000 * 60 * 60 * 24 * n; });
  // Verify that the contacts events calendar exists.
  if (!eventCalendar) {
    throw new Error('Contacts events calendar not found! Please follow the instructions (step "Enable the calendar").');
  }

  // Start building the email notification text.
  subjectPrefix = _('Events') + ': ';
  subjectBuilder = [];
  bodyPrefix = _('Hey! Don\'t forget these events') + ':';
  bodySuffix1 = _('Google Contacts Events Notifier') + ' (' + _('version') + ' ' + version.toString() + ')';
  bodySuffix2 = _('by') + ' Giorgio Bonvicini';
  bodySuffix3 = _('It looks like you are using an outdated version of this script') + '.';
  bodySuffix4 = _('You can find the latest one here');

  // The email is built both with plain text and HTML text.
  bodyBuilder = [];
  htmlBodyBuilder = [];

  // Use the testDate if specified, otherwise use todays' date.
  now = testDate || new Date();
  doLog('Date used: ' + now);

  inlineImages = {};
  /*
   * Look for events on each of the days specified by the user.
   * timeInterval represents how many milliseconds in the future to check.
   */
  anticipate.forEach(
    function (timeInterval) {
      var optionalArgs, events;

      // Set the search filter to include only events happening 'timeInterval' milliseconds after now.
      optionalArgs = {
        // Filter only events happening between 'now + timeInterval'...
        timeMin: Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        // ... and 'now + timeInterval + 1 sec'.
        timeMax: Utilities.formatDate(new Date(now.getTime() + timeInterval + 1000), calendarTimeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        // Treat recurring events (like birthdays) as single events.
        singleEvents: true
      };

      events = Calendar.Events.list(calendarId, optionalArgs).items;

      eventTypes.forEach(
        function (eventType) {
          var eventTypeNamePlural, theseEvents, formattedDate, whenIsIt;

          switch (eventType) {
            case 'BIRTHDAY':
              eventTypeNamePlural = 'birthdays';
              break;
            case 'ANNIVERSARY':
              eventTypeNamePlural = 'anniversaries';
              break;
            case 'CUSTOM':
              eventTypeNamePlural = 'custom events';
          }

          // Get all the matching 'eventType' events.
          doLog('Checking ' + eventTypeNamePlural + ' from ' + optionalArgs.timeMin + ' to ' + optionalArgs.timeMax);
          theseEvents = events.filter(function (e) { return e.gadget.preferences['goo.contactsEventType'] === eventType; });
          doLog('Found ' + theseEvents.length + ' ' + eventTypeNamePlural + ' in this time range.');
          // If no 'eventType' event is found for this particular timeInterval skip it.
          if (theseEvents.length < 1) {
            return;
          }
          formattedDate = Utilities.formatDate(new Date(now.getTime() + timeInterval), calendarTimeZone, _('dd-MM-yyyy'));
          // Build the headers of 'eventType' event grouping by date.
          bodyBuilder.push('\n * ');
          htmlBodyBuilder.push('<dt style="margin-left:0.8em;font-style:italic">');
          whenIsIt = eventTypeNamePlural.charAt(0).toUpperCase() + eventTypeNamePlural.slice(1);
          switch (timeInterval / (24 * 60 * 60 * 1000)) {
            case 0:
              whenIsIt += ' today';
              break;
            case 1:
              whenIsIt += ' tomorrow';
              break;
            default:
              whenIsIt += ' in {0} days';
          }
          whenIsIt = _(whenIsIt).format(timeInterval / (24 * 60 * 60 * 1000)) + ' (' + formattedDate + ')';
          bodyBuilder.push(whenIsIt, ':\n');
          htmlBodyBuilder.push(whenIsIt, '</dt><dd style="margin-left:0.4em;padding-left:0"><ul style="list-style:none;margin-left:0;padding-left:0;">');

          // Add each of the 'eventType' events for this timeInterval.
          theseEvents.forEach(
            function (event, i) {
              var contact;

              doLog('Contact # ' + i + ' ' + eventTypeNamePlural + '.');
              contact = new Contact(event, eventType);
              subjectBuilder.push(contact.fullName);
              bodyBuilder.extend(contact.getPlainTextLine());
              htmlBodyBuilder.extend(contact.getHtmlLine());
            }
          );

          bodyBuilder.push('\n');
          htmlBodyBuilder.push('</ul></dd>');
        }
      );
    }
  );

  // If there is an email to send...
  if (bodyBuilder.length > 0) {
    subject = subjectPrefix + uniqueStrings(subjectBuilder).join(' - ');
    body = [bodyPrefix, '\n']
        .concat(bodyBuilder)
        .concat(['\n\n ', bodySuffix1, '\n ', bodySuffix2, '\n'])
        .concat('\n', isRunningOutdatedVersion() ? [bodySuffix3, ' ', bodySuffix4, ':\n', baseGitHubProjectURL + 'releases/latest', '\n '] : [])
        .join('');
    htmlBody = ['<h3>', htmlEscape(bodyPrefix), '</h3><dl>']
        .concat(htmlBodyBuilder)
        .concat(['</dl><hr/><p style="text-align:center;font-size:smaller"><a href="' + baseGitHubProjectURL + '">', htmlEscape(bodySuffix1), '</a><br/>', htmlEscape(bodySuffix2)])
        .concat(isRunningOutdatedVersion() ? ['<br/><br/><b>', htmlEscape(bodySuffix3), ' <a href="', baseGitHubProjectURL, 'releases/latest', '">', htmlEscape(bodySuffix4), '</a>.</b></p>'] : ['</p>'])
        .join('');

    // ...send the email notification.
    doLog('Sending email...');
    MailApp.sendEmail({
      to: myEmail,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
      inlineImages: inlineImages,
      name: emailSenderName
    });
    doLog('Email sent.');
  }
  // Send the log if the debug options say so.
  if (!noLog && sendLog) {
    MailApp.sendEmail({
      to: myEmail,
      subject: 'Logs for contact-events-notification run',
      body: Logger.getLog(),
      name: emailSenderName
    });
  }
}

/*
 * Extract contact data from a contact event and integrate it with additional data
 * recovered directly from Google Contact through the contactId field if present.
 */
var Contact = function (event, eventType) {
  var eventData, googleContact, currentYear, startYear, phoneFields, dates, self;

  self = this; // for consistent access from sub-functions
  // Extract basic data from the event description.
  eventData = event.gadget.preferences;
  self.eventDate = (typeof event.start.date === 'undefined') ? null : new Date(event.start.date);
  self.id = (typeof eventData['goo.contactsContactId'] === 'undefined') ? '' : eventData['goo.contactsContactId'];
  self.fullName = (typeof eventData['goo.contactsFullName'] === 'undefined') ? '' : eventData['goo.contactsFullName'];
  self.email = (typeof eventData['goo.contactsEmail'] === 'undefined') ? '' : eventData['goo.contactsEmail'];
  self.photo = (typeof eventData['goo.contactsPhotoUrl'] === 'undefined') ? '' : eventData['goo.contactsPhotoUrl'];
  self.dateLabels = [];
  self.age = {};
  self.phoneFields = [];
  self.nickname = '';
  self.eventType = eventType;
  self.eventTypeCustomString = typeof eventData['goo.contactsCustomEventType'] === 'undefined' ? '' : eventData['goo.contactsCustomEventType'];

  if (self.email !== '') {
    doLog('Has email.');
  }
  if (self.fullName !== '') {
    doLog('Has full name.');
  }
  if (self.photo !== '') {
    doLog('Has photo.');
  } else {
    doLog('Using default profile image.');
    self.photo = baseRawFilesURL + 'images/default_profile.jpg';
  }
  // If the contact is a Google contact and not just a Google Plus contact try to get the Google Contact via the contactId.
  if (eventData['goo.contactsIsMyContact'] === 'false' || self.id === '') {
    self.dateLabels.push(self.eventType);
  } else {
    doLog('Has Google ID.');
    googleContact = ContactsApp.getContactById('http://www.google.com/m8/feeds/contacts/' + encodeURIComponent(myGoogleEmail) + '/base/' + self.id);
  }

  // If a valid Google Contact exists extract some additional data.
  if (googleContact) {
    currentYear = Utilities.formatDate(new Date(event.start.date.replace(/-/g, '/')), calendarTimeZone, 'yyyy');
    // Get all the events for this day from the contact.
    if (self.eventType === 'BIRTHDAY' || self.eventType === 'ANNIVERSARY') {
      dates = [googleContact.getDates(ContactsApp.Field[self.eventType])[0]];
    } else if (self.eventType === 'CUSTOM') {
      dates = googleContact.getDates(self.eventTypeCustomString).filter(function (x) {
        return (x.getDay() === self.eventDate.getDate() && monthToInt(x.getMonth()) === self.eventDate.getMonth());
      });
    }

    // Store information for each event (name and years passed).
    dates.forEach(function (eachDate) {
      var dateLabel = eachDate.getLabel();
      doLog('Has ' + dateLabel + ' year.');
      self.dateLabels.push(dateLabel);
      startYear = eachDate.getYear();
      if (startYear) {
        self.age[dateLabel] = (currentYear - startYear).toFixed(0);
      }
    });

    // Extract contact's phone numbers.
    phoneFields = googleContact.getPhones();
    if (phoneFields.length > 0) {
      self.phoneFields = phoneFields;
      doLog('Has phones.');
    }
    // Extract contact's nickname.
    self.nickname = googleContact.getNickname();
  }

  /*
   * Use the extracted data to build a plain line of text displaying all the
   * collected data about the contact.
   */
  self.getPlainTextLine = function () {
    var lines;
    lines = [];
    self.dateLabels.forEach(function (dateLabel) {
      var line;
      line = ['\n', indent];
      // Custom label
      if (self.eventType === 'CUSTOM') {
        line.push('<' + dateLabel + '> ');
      }
      // Full name.
      line.push(self.fullName);
      // Nickname.
      if (self.nickname !== '') {
        line.push(' "', self.nickname, '"');
      }
      // Age.
      if (self.age.hasOwnProperty(dateLabel) && self.age[dateLabel] !== '') {
        if (self.eventType === 'BIRTHDAY') {
          line.push(' - ', _('Age'), ': ');
        } else {
          line.push(' - ', _('Years'), ': ');
        }
        line.push(self.age[dateLabel]);
      }

      if (self.email !== '' || typeof self.phoneFields !== 'undefined') {
        line.push(' (');
        // Email address.
        if (self.email !== '') {
          line.push(self.email);
        }
        // Phone numbers.
        self.phoneFields.forEach(function (phoneField, i) {
          var label;
          if (i !== 0 || self.email !== '') {
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
      lines.push(line);
    });
    return lines.map(function (x) { return x.join(''); }).join('\n');
  };

  /*
   * Use the extracted data to build a line of HTML text displaying all the
   * collected data about the contact.
   */
  self.getHtmlLine = function () {
    var lines;
    lines = [];
    self.dateLabels.forEach(function (dateLabel) {
      var line, imgCount;
      line = ['<li>'];
      // Profile photo.
      if (self.photo !== '') {
        imgCount = Object.keys(inlineImages).length;
        inlineImages['contact-img-' + imgCount] = UrlFetchApp.fetch(self.photo).getBlob().setName('contact-img-' + imgCount);
        line.push('<img src="cid:contact-img-' + imgCount + '" style="height:1.4em;margin-right:0.4em" />');
      }
      // Custom label
      if (self.eventType === 'CUSTOM') {
        line.push('&lt;' + htmlEscape(dateLabel) + '&gt; ');
      }
      // Full name.
      line.push(htmlEscape(self.fullName));
      // Nickname.
      if (self.nickname !== '') {
        line.push(' &quot;', htmlEscape(self.nickname), '&quot;');
      }
      // Age.
      if (self.age.hasOwnProperty(dateLabel) && self.age[dateLabel] !== '') {
        if (self.eventType === 'BIRTHDAY') {
          line.push(' - ', _('Age'), ': ');
        } else {
          line.push(' - ', _('Years'), ': ');
        }
        line.push(self.age[dateLabel]);
      }
      if (self.email !== '' || typeof self.phoneFields !== 'undefined') {
        line.push(' (');
        // Email address.
        if (self.email !== '') {
          line.push('<a href="mailto:', self.email, '">', self.email, '</a>');
        }
        // Phone fields.
        self.phoneFields.forEach(function (phoneField, i) {
          var label;
          if (i !== 0 || self.email !== '') {
            line.push(' - ');
          }
          label = phoneField.getLabel();
          if (label !== '') {
            line.push('[', htmlEscape(beautifyLabel(label)), '] ');
          }
          line.push('<a href="tel:', phoneField.getPhoneNumber(), '">', phoneField.getPhoneNumber(), '</a>');
        });
        line.push(')');
      }
      lines.push(line);
    });
    return lines.map(function (x) { return x.join(''); }).join('\n');
  };
};

// Start the notification service.
function start () {
  if (notificationHour < 0 || notificationHour > 23 || parseInt(Number(notificationHour)) !== notificationHour) {
    throw new Error('Invalid parameter: notificationHour. Must be an integer between 0 and 23.');
  }
  stop();
  try {
    ScriptApp.newTrigger('normal')
    .timeBased()
    .atHour(notificationHour)
    .everyDays(1)
    .inTimezone(myTimeZone)
    .create();
  } catch (err) {
    throw new Error('Failed to start the notification service: make sure that myTimeZone is a valid value.');
  }
}

// Stop the notification service.
function stop () {
  var triggers;
  // Delete all the triggers.
  triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

// Check if notification service is running.
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
      subject: 'Status for contact-event-notification',
      body: Logger.getLog(),
      name: emailSenderName
    });
  }
}

// Normal function call (This function is called by the timed trigger).
function normal () {
  checkEvents();
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
  checkEvents(testDate);
}
