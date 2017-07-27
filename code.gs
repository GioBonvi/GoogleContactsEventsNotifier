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

var version = '3.0.0-alpha';

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
  },
  'es': {
    'Age': 'Edad',
    // TODO: 'Years': '',
    // TODO: 'Events': '',
    'Birthday today': 'Cumpleaños hoy', // TODO: Birthday -> Birthdays (plural)
    'Birthday tomorrow': 'Cumpleaños mañana', // TODO: Birthday -> Birthdays (plural)
    'Birthday in {0} days': 'Cumpleaños en {0} días', // TODO: Birthday -> Birthdays (plural)
    // TODO: 'Anniversaries today': '',
    // TODO: 'Anniversaries tomorrow': '',
    // TODO: 'Anniversaries in {0} days': '',
    // TODO: 'Custom events today': '',
    // TODO: 'Custom events tomorrow': '',
    // TODO: 'Custom events in {0} days': '',
    'Hey! Don\'t forget these events': 'Hey! No olvides estos cumpleaños', // TODO: birthdays -> events
    'version': 'versión',
    'by': 'por',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Celular',
    'Work phone': 'Teléfono del trabajo',
    'Home phone': 'Teléfono del hogar',
    'Main phone': 'Teléfono principal',
  },
  'it': {
    'Age': 'Età',
    'Years': 'Anni',
    'Events': 'Eventi',
    'Birthday today': 'Compleanni oggi',
    'Birthday tomorrow': 'Compleanni domani',
    'Birthday in {0} days': 'Compleanni fra {0} giorni',
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
  },
  'id': {
    'Age': 'Usia',
    // TODO: 'Years': '',
    // TODO: 'Events': '',
    'Birthday today': 'Ulang tahun hari ini', // TODO: Birthday -> Birthdays (plural)
    'Birthday tomorrow': 'Ulang tahun besok', // TODO: Birthday -> Birthdays (plural)
    'Birthday in {0} days': 'Ulang tahun dalam {0} hari', // TODO: Birthday -> Birthdays (plural)
    // TODO: 'Anniversaries today': '',
    // TODO: 'Anniversaries tomorrow': '',
    // TODO: 'Anniversaries in {0} days': '',
    // TODO: 'Custom events today': '',
    // TODO: 'Custom events tomorrow': '',
    // TODO: 'Custom events in {0} days': '',
    'Hey! Don\'t forget these events': 'Hai! Jangan lupa hari ulang tahun berikut', // TODO: birthdays -> events
    'version': 'versi',
    'by': 'oleh',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telp. selular',
    'Work phone': 'Telp. kantor',
    'Home phone': 'Telp. rumah',
    'Main phone': 'Telp. utama',
  },
  'de': {
    'Age': 'Alter',
    // TODO: 'Years': '',
    // TODO: 'Events': '',
    'Birthday today': 'Heute Geburtstag', // TODO: Birthday -> Birthdays (plural)
    'Birthday tomorrow': 'Morgen Geburtstag', // TODO: Birthday -> Birthdays (plural)
    'Birthday in {0} days': 'Geburtstag in {0} Tagen', // TODO: Birthday -> Birthdays (plural)
    // TODO: 'Anniversaries today': '',
    // TODO: 'Anniversaries tomorrow': '',
    // TODO: 'Anniversaries in {0} days': '',
    // TODO: 'Custom events today': '',
    // TODO: 'Custom events tomorrow': '',
    // TODO: 'Custom events in {0} days': '',
    'Hey! Don\'t forget these events': 'Hey! Vergiss diese Geburtstage nicht', // TODO: birthdays -> events
    'version': 'Version',
    'by': 'von',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobiltelefon',
    'Work phone': 'Geschäftlich',
    'Home phone': 'Privat',
    'Main phone': 'Hauptnummer',
  },
  'pl': {
    'Age': 'Wiek',
    // TODO: 'Years': '',
    // TODO: 'Events': '',
    'Birthday today': 'Urodziny dzisiaj', // TODO: Birthday -> Birthdays (plural)
    'Birthday tomorrow': 'Urodziny jutro', // TODO: Birthday -> Birthdays (plural)
    'Birthday in {0} days': 'Urodziny za {0} dni', // TODO: Birthday -> Birthdays (plural)
    // TODO: 'Anniversaries today': '',
    // TODO: 'Anniversaries tomorrow': '',
    // TODO: 'Anniversaries in {0} days': '',
    // TODO: 'Custom events today': '',
    // TODO: 'Custom events tomorrow': '',
    // TODO: 'Custom events in {0} days': '',
    'Hey! Don\'t forget these events': 'Hej! Nie zapomnij o tych urodzinach', // TODO: birthdays -> events
    'version': 'wersja',
    'by': 'od',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telefon komórkowy',
    'Work phone': 'Telefon praca',
    'Home phone': 'Telefon domowy',
    'Main phone': 'Telefon główny',
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
    bodyPrefix, bodySuffix1, bodySuffix2, bodyBuilder, htmlBodyBuilder, now, subject, body, htmlBody;

  doLog('Starting run of Google Contacts Events Notifier version ' + version + '.');
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
  bodySuffix1 = _('Google Contacts Events Notifier') + ' (' + _('version') + ' ' + version + ')';
  bodySuffix2 = _('by') + ' Giorgio Bonvicini';
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
           .join('');
    htmlBody = ['<h3>', bodyPrefix, '</h3><dl>']
               .concat(htmlBodyBuilder)
               .concat(['</dl><hr/><p style="text-align:center;font-size:smaller"><a href="https://github.com/GioBonvi/GoogleBirthdayNotifier">', bodySuffix1, '</a><br/>', bodySuffix2, '</p>'])
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
  var eventData, googleContact, currentYear, startYear, phoneFields, dates, dateObj, self;

  self = this; // for consistent access from sub-functions

  // Extract basic data from the event description.
  eventData = event.gadget.preferences;
  self.id = (typeof eventData['goo.contactsContactId'] === 'undefined') ? '' : eventData['goo.contactsContactId'];
  self.fullName = (typeof eventData['goo.contactsFullName'] === 'undefined') ? '' : eventData['goo.contactsFullName'];
  self.email = (typeof eventData['goo.contactsEmail'] === 'undefined') ? '' : eventData['goo.contactsEmail'];
  self.photo = (typeof eventData['goo.contactsPhotoUrl'] === 'undefined') ? '' : eventData['goo.contactsPhotoUrl'];
  self.dateLabels = [];
  self.age = {};
  self.phoneFields = [];
  self.nickname = '';
  self.eventType = eventType;

  if (self.email !== '') {
    doLog('Has email.');
  }
  if (self.fullName !== '') {
    doLog('Has full name.');
  }
  if (self.photo !== '') {
    doLog('Has photo.');
  }
  // If the contact has a contactId field try to get the Google Contact corresponding to that contactId.
  if (self.id === '') {
    self.dateLabels.push(self.eventType);
  } else {
    doLog('Has Google ID.');
    googleContact = ContactsApp.getContactById('http://www.google.com/m8/feeds/contacts/' + encodeURIComponent(myGoogleEmail) + '/base/' + self.id);
  }

  // If a valid Google Contact exists extract some additional data.
  if (googleContact) {
    // Extract contact's birthday/anniversary/custom "age" if the contact's relevant field has the year.
    currentYear = Utilities.formatDate(new Date(event.start.date.replace(/-/g, '/')), calendarTimeZone, 'yyyy');
    if (self.eventType === 'BIRTHDAY' || self.eventType === 'ANNIVERSARY') {
      dates = [googleContact.getDates(ContactsApp.Field[self.eventType])[0]];
    } else if (self.eventType === 'CUSTOM') {
      dateObj = googleContact.getDates();
      dates = Object.keys(dateObj)
      .map(function (key) { return dateObj[key]; })
      .filter(function (x) { return typeof (x.getLabel()) === 'string'; }); // for BIRTHDAY/ANNIVERSARY getLabel() returns object
    }

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
        line.push('&lt;' + dateLabel + '&gt; ');
      }
      // Full name.
      line.push(self.fullName);
      // Nickname.
      if (self.nickname !== '') {
        line.push(' &quot;', self.nickname, '&quot;');
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
            line.push('[', beautifyLabel(label), '] ');
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
