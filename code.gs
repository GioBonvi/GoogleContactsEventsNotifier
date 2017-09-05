/* global Logger CalendarApp ScriptApp ContactsApp Utilities Calendar UrlFetchApp MailApp Session */

/*
 * Thanks to this script you are going to receive an email before events of each of your contacts.
 * The script is easily customizable via some variables listed below.
 */

// SETTINGS

var settings = {
  user: {
    /*
     * GOOGLE EMAIL ADDRESS
     *
     * Replace this fake Gmail address with the Gmail address of your own Google Account.
     * This is needed to retrieve information about your contacts.
     */
    googleEmail: 'YOUREMAILHERE@gmail.com',
    /*
     * NOTIFICATION EMAIL ADDRESS
     *
     * Replace this fake email address with the one you want the notifications to be sent
     * to. This can be the same email address as 'googleEmail' on or any other email
     * address. Non-Gmail addresses are fine as well.
     */
    notificationEmail: 'YOUREMEAILHERE@example.com',
    /*
     * ID OF THE CONTACTS EVENTS CALENDAR
     *
     * Open https://calendar.google.com, in the menu on the left click on the arrow next to the
     * the contacts events calendar (which should have a name like 'Birthdays and events'), choose
     * 'Calendar settings' and finally look for the "Calendar ID field" (it could be something
     * similar to the default value of '#contacts@group.v.calendar.google.com', but also really
     * different from it): copy and paste it between the quotes in the next line.
     */
    calendarId: '#contacts@group.v.calendar.google.com',
    /*
     * EMAIL SENDER NAME
     *
     * This is the name you will see as the sender of the email: if you leave it blank it will
     * default to your Google account name.
     * Note: this may not work when notificationEmail is a Gmail address.
     */
    emailSenderName: 'Contacts Events Notifications',
    /*
     * LANGUAGE
     *
     * To translate the notifications messages into your language enter the two-letter language
     * code here.
     * Available languages are: el, es, it, de, id, pl, fr.
     * If you want to add your own language find the variable called i18n below and follow the
     * instructions: it's quite simple as long as you can translate from one of the available
     * languages.
     */
    lang: 'en'
  },
  notifications: {
    /*
    * HOUR OF THE NOTIFICATION
    *
    * Specify at which hour of the day would you like to receive the email notifications.
    * This must be an integer between 0 and 23.
    */
    hour: 6,
    /*
    * NOTIFICATION TIMEZONE
    *
    * To ensure the correctness of the notifications timing please set this variable to the
    * timezone you are living in.
    * Accepted values:
    *  GMT (e.g. 'GMT-4', 'GMT+6')
    *  regional timezones (e.g. 'Europe/Berlin' - See here for a complete list: http://joda-time.sourceforge.net/timezones.html)
    */
    timeZone: 'Europe/Rome',
    /*
     * HOW MANY DAYS BEFORE EVENT
     *
     * Here you have to decide when you want to receive the email notification.
     * Insert a comma-separated list of numbers between the square brackets, where each number
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
    anticipateDays: [0, 1, 7],
    /*
     * TYPE OF EVENTS
     *
     * This script can track any Google Contact Event: you can decide which ones by placing true
     * or false next to each type in the following lines.
     * By default the script only tracks birthday events.
     */
    eventTypes: {
      BIRTHDAY: true,
      ANNIVERSARY: true,
      CUSTOM: true
    },
    /*
     * MAXIMUM NUMBER OF EMAIL ADDRESSES
     *
     * You can limit the maximum number of email addresses displayed for each contact in the notification emails
     * by changing this number. If you don't want to impose any limits change it to -1, if you don't want any
     * email address to be shown change it to 0.
     */
    maxEmailsCount: -1,
    /*
     * MAXIMUM NUMBER OF PHONE NUMBERS
     *
     * You can limit the maximum number of phone numbers displayed for each contact in the notification emails
     * by changing this number. If you don't want to impose any limits change it to -1, if you don't want any
     * phone number to be shown change it to 0.
     */
    maxPhonesCount: -1,
    /*
     * INDENT SIZE
     *
     * Use this variable to determine how many spaces are used for indentation.
     * This is used in plaintext emails only.
     */
    indentSize: 4
  },
  debug: {
    log: {
      /*
       * LOGGING FILTER LEVEL
       *
       * This settings lets you filter which type of events will get logged:
       *  - 'info' will log all types of events event (messages, warnings and errors);
       *  - 'warning' will log warnings and errors only (discarding messages);
       *  - 'error' will log errors only (discarding messages and warnings);
       *  - 'none' will effectively disable the logging (nothing will be logged);
       */
      filterLevel: 'info',
      /*
       * Set this variable to: 'info', 'warning', 'error' or 'none'. You will be sent an
       * email containing the full execution log of the script if at least one event of priority
       * equal or greater to sendTrigger has been logged. 'none' means that such emails will
       * never be sent.
       * Note: filterLevel have precedence over this setting! For example if you set filterLevel
       * to 'none' and sendTrigger to 'warning' you will never receive any email as nothing will
       * be logged due to the filterLevel setting.
       */
      sendTrigger: 'warning'
    },
    /*
     * TEST DATE
     *
     * When using the test() function this date will be used as "now". The date must be in the
     * YYYY/MM/DD HH:MM:SS format.
     * Choose a date you know should trigger an event notification.
     */
    testDate: new Date('2017/10/19 06:00:00')
  }
};

/*
 * There is no need to edit anything below this line.
 * The script will work if you inserted valid values up until here, however feel free to take a peek at my code ;)
 */

// CLASSES

/*
 * Manage a collection of logEvents {time, text, priority}.
 *
 * Parameters:
 *  minimumPriority (string): events with lower priority than this will not be logged.
 *  emailMinimumPriority (string): an email with the log output will be sent to the user if at least one
 *                                 event was recorded with priority greater than or equal to this priority.
 */
function Log (minimumPriority, emailMinimumPriority) {
  this.minimumPriority = this.evalPriority(minimumPriority);
  this.emailMinimumPriority = this.evalPriority(emailMinimumPriority);
  this.events = [];
}

/*
 * Store a new event in the log. The default priority is the lowest one ('info').
 */
Log.prototype.add = function (data, priority) {
  var text;

  priority = priority || 'info';
  if (typeof data === 'object') {
    text = JSON.stringify(data);
  } else if (typeof data !== 'string') {
    text = String(data);
  } else {
    text = data;
  }
  if (this.evalPriority(priority) >= this.minimumPriority) {
    this.events.push({
      time: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy hh:mm:ss') + ' ' + Session.getScriptTimeZone(),
      priorityDescr: priority,
      priorityVal: this.evalPriority(priority),
      text: text
    });
  }

  // Still log into the standard logger as a backup in case the program crashes.
  Logger.log(priority[0].toUpperCase() + ': ' + text);

  // Throw an Error and interrupt the execution if the log event had 'error' priority.
  if (priority === 'error') {
    this.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
    throw new Error(text);
  }
};

/*
 * Calculate a numeric value for a textual description of a priority.
 */
Log.prototype.evalPriority = function (priority) {
  switch (priority) {
    case 'none':
      return 100;
    case 'error':
      return 10;
    case 'warning':
      return 5;
    case 'info':
      // falls through
    default:
      return 1;
  }
};

/*
 * Get the output of the log as an array of messages.
 */
Log.prototype.getOutput = function () {
  return this.events.map(function (e) {
    return '[' + e.time + ']' + e.priorityDescr[0].toUpperCase() + ': ' + e.text;
  });
};

/*
 * Verify if the log contains at least an event with priority equal to or greater than
 * the specified priority.
 */
Log.prototype.containsMinimumPriority = function (minimumPriority) {
  var i;

  for (i = 0; i < this.events.length; i++) {
    if (this.events[i].priorityVal >= minimumPriority) {
      return true;
    }
  }
  return false;
};

/*
 * If the filter condition is met send all the logs collected to the specified email.
 */
Log.prototype.sendEmail = function (to, senderName) {
  if (this.containsMinimumPriority(this.emailMinimumPriority)) {
    this.add('Sending logs via email.');
    MailApp.sendEmail({
      to: to,
      subject: 'Logs for Google Contacts Events Notifications',
      body: this.getOutput().join('\n'),
      name: senderName
    });
  }
};

/*
 * An object representing a simplified semantic version number.
 * It must be composed of:
 *  - three dot-separated positive integers (major version,
 *    minor version and patch number);
 *  - optionally a pre-release identifier, prefixed by a hyphen;
 *  - optionally a metadata identifier, prefixed by a plus sign;
 * This differs from the official SemVer style because the pre-release
 * string is compared as a whole in version comparison instead of
 * being spliced into chunks.
 * Valid examples:
 *  4.6.2, 3.12.234-alpha,  0.11.0+20170827, 2.0.0-beta+20170827
 */
function SimplifiedSemanticVersion (versionNumber) {
  var matches, self;

  self = this;
  this.numbers = [0, 0, 0];
  this.prerelease = '';
  this.metadata = '';

  matches = versionNumber.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+?))?(?:\+(.+))?$/);
  if (matches) {
    self.numbers[0] = parseInt(matches[1]);
    self.numbers[1] = parseInt(matches[2]);
    self.numbers[2] = parseInt(matches[3]);
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
    (this.metadata !== '' ? '+' + this.metadata : '');
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

// EXTENDED NATIVE PROTOTYPES

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

// GLOBAL VARIABLES

 /*
 * The version of the script.
 * It must be a valid SimplifiedSemanticVersion.
 */
var version = new SimplifiedSemanticVersion('3.2.0-alpha');

// These URsL are used to access the files in the repository or specific pages on GitHub.
var baseRawFilesURL = 'https://raw.githubusercontent.com/GioBonvi/GoogleContactsEventsNotifier/master/';
var baseGitHubProjectURL = 'https://github.com/GioBonvi/GoogleContactsEventsNotifier/';

// Convert user-configured hash to an array
var eventTypes = Object.keys(settings.notifications.eventTypes)
  .filter(function (x) { return settings.notifications.eventTypes[x]; });

var indent = Array(settings.notifications.indentSize + 1).join(' ');

var inlineImages;

var log = new Log(settings.debug.log.filterLevel, settings.debug.log.sendTrigger);

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
    'It looks like you are using an outdated version of this script': 'Φαίνεται οτι χρησιμοποιείς μια παλαιότερη εκδοχή αυτής της δέσμης ενεργειών',
    'You can find the latest one here': 'Μπορείς να βρείς την τελευταία εδώ',
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
    'It looks like you are using an outdated version of this script': 'Parece que estás usando una versión antigua de este script',
    'You can find the latest one here': 'Puedes encontrar la última aquí',
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
    'It looks like you are using an outdated version of this script': 'Sepertinya anda menggunakan versi lama dari skrip ini',
    'You can find the latest one here': 'Anda bisa menemukan versi terbaru di sini',
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
    'It looks like you are using an outdated version of this script': 'Du scheinst eine veraltete Version dieses Skripts zu benutzen',
    'You can find the latest one here': 'Die aktuelle Version findest du hier', // Using feminime version of 'latest', because it refers to 'version'. There's possibility it won't fit into diffrent context.
  },
  'pl': {
    'Age': 'Wiek',
    'Years': 'Lat',
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
    'by': 'Stworzone przez',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telefon komórkowy',
    'Work phone': 'Telefon (praca)',
    'Home phone': 'Telefon (domowy)',
    'Main phone': 'Telefon (główny)',
    'It looks like you are using an outdated version of this script': 'Wygląda na to, że używasz nieaktualnej wersji skryptu',
    'You can find the latest one here': 'Najnowszą możesz znaleźć tutaj', // Using feminime version of 'latest', because it refers to 'version'. There's possibility it won't fit into diffrent context.
  },
  'fr': {
    'Age': 'Age',
    'Years': 'Années',
    'Events': 'Evénements',
    'Birthdays today': 'Anniversaire aujourd\'hui',
    'Birthdays tomorrow': 'Anniversaire demain',
    'Birthdays in {0} days': 'Anniversaire dans {0} jours',
    'Anniversaries today': 'Anniversaire aujourd\'hui',
    'Anniversaries tomorrow': 'Anniversaire demain',
    'Anniversaries in {0} days': 'Anniversaire dans {0} jours',
    'Custom events today': 'Autres événements aujourd\'hui',
    'Custom events tomorrow': 'Autres événements demain',
    'Custom events in {0} days': 'Autres événements dans {0} jours',
    'Hey! Don\'t forget these events': 'Hey n\'oubliez pas ces événements',
    'version': 'version',
    'by': 'par',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobile',
    'Work phone': 'Travail',
    'Home phone': 'Maison',
    'Main phone': 'Principal',
    'It looks like you are using an outdated version of this script': 'Il semble que vous utilisez une ancienne version de ce script',
    'You can find the latest one here': 'Vous pouvez trouver la dernière version ici',
  },
  /* To add a language:
  '[lang-code]': {
    '[first phrase]': '[translation here]',
    '[second phrase]': '[translation here]',
    ...
  }
  */
};

// HELPER FUNCTIONS

/*
 * Get the translation of a string.
 * If the language or the chosen string is invalid return the string itself.
 */
function _ (string) {
  return i18n[settings.user.lang][string] || string;
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
      return String(label);
  }
}

function htmlEscape (str) {
  return str
         .replace(/&/g, '&amp;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/\//g, '&#x2F;');
}

/*
 * Get the last version number from the GitHub file and compare it with the script's one.
 * If they do not match the user is running an outdated version of the script.
 * If there is any problem retrieving the latest version number just return false.
 */
function isRunningOutdatedVersion () {
  var response, latestVersion;

  response = UrlFetchApp.fetch(baseRawFilesURL + 'code.gs');
  if (response.getResponseCode() !== 200) {
    log.add('Unable to get the latest version number: the requested URL returned a ' + response.getResponseCode() + ' response.', 'warning');
    return false;
  }

  latestVersion = /var version = new SimplifiedSemanticVersion\('(.+)'\);/.exec(response.getContentText('UTF-8'));
  if (latestVersion === null) {
    log.add('Unable to get the latest version number: the version number could not be found in the text file.', 'warning');
    return false;
  }

  try {
    return (version).compare(new SimplifiedSemanticVersion(latestVersion[1])) === -1;
  } catch (err) {
    log.add(err.message, 'warning');
    return false;
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

function uniqueStrings (x) {
  var seen = {};
  return x.filter(function (str) {
    return seen.hasOwnProperty(str) ? false : (seen[str] = true);
  });
}

// MAIN FUNCTIONS

/*
 * Returns an array with the events happening in the calendar with
 * ID 'calendarId' on date 'eventDate'.
 */
function getEventsOnDate (eventDate, calendarId) {
  var eventCalendar, startDate, endDate, events;

  // Verify the existence of the vents calendar.
  eventCalendar = Calendar.Calendars.get(calendarId);
  if (eventCalendar === null) {
    log.add('The calendar with ID "' + calendarId + '" is not accessible: check your calendarId value!', 'error');
  }

  // Query the events calendar for events on the specified date.
  try {
    startDate = Utilities.formatDate(eventDate, eventCalendar.timeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    endDate = Utilities.formatDate(new Date(eventDate.getTime() + 1 * 60 * 60 * 1000), eventCalendar.timeZone, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    log.add('Looking for contacts events on ' + eventDate + ' (' + startDate + ' / ' + endDate + ')', 'info');
  } catch (err) {
    log.add(err.message, 'error');
  }
  events = Calendar.Events.list(
    calendarId,
    {
      singleEvents: true,
      timeMin: startDate,
      timeMax: endDate
    }
  ).items;

  log.add('Found: ' + events.length);

  return events;
}

/*
 * Send an email notification to the user containing a list of the events
 * of his/her contacts scheduled for the next days.
 */
function main (forceDate) {
  var now, events;

  log.add('main() running.', 'info');
  now = forceDate || new Date();
  log.add('Date used: ' + now, 'info');

  events = [].concat.apply(
    [],
    settings.notifications.anticipateDays
      .map(function (days) {
        return getEventsOnDate(
          new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
          settings.user.calendarId
        );
      })
  );

  if (events.length === 0) {
    log.add('No events found. Exiting now.', 'info');
    return;
  }
  log.add('Found ' + events.length + 'events.', 'info');
  // TODO.
}

/*
 * Execute the main() function without forcing any date as "now".
 */
function normal () {
  log.add('normal() running.', 'info');
  main(null);
}

/*
 * Executie the main() function forcing a given date as "now".
 */
function test () {
  log.add('test() running.', 'info');
  main(settings.debug.testDate);
}

// NOTIFICATION SERVICE FUNCTIONS

/*
 * Start the notification service.
 */
function notifStart () {
  if (
    settings.notifications.hour < 0 ||
    settings.notifications.hour > 23 ||
    parseInt(settings.notifications.hour, 10) !== settings.notifications.hour
  ) {
    log.add('Invalid parameter: notificationHour. Must be an integer between 0 and 23.', 'error');
  }
  // Delete old triggers.
  notifStop();
  // Add a new trigger.
  try {
    ScriptApp.newTrigger('normal')
    .timeBased()
    .atHour(settings.notifications.hour)
    .everyDays(1)
    .inTimezone(settings.notifications.timeZone)
    .create();
  } catch (err) {
    log.add('Failed to start the notification service: make sure that settings.notifications.timeZone is a valid value.', 'error');
  }
  log.add('Notification service started.', 'info');
}

/*
 * Stop the notification service.
 */
function notifStop () {
  var triggers;
  // Delete all the triggers.
  triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  log.add('Notification service stopped.', 'info');
}

/*
 * Check if notification service is running.
 */
function notifStatus () {
  var toLog = 'Notifications are ';
  if (ScriptApp.getProjectTriggers().length < 1) {
    toLog += 'not ';
  }
  toLog += 'running.';
  log.add(toLog);
  log.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
}
