/* global Logger MailApp People PropertiesService Session ScriptApp UrlFetchApp Utilities */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
/* eslint comma-dangle: ["error", "only-multiline"] */
/* eslint quote-props: off */

// #region SETTINGS

const defaultSettings = {
  user: {
    /*
     * NOTIFICATION EMAIL ADDRESS
     *
     * Replace this fake email address with the one you want the notifications to be sent
     * to. This can be the same email address as 'googleEmail' on or any other email
     * address. Non-Gmail addresses are fine as well.
     */
    notificationEmail: 'YOUREMEAILHERE@example.com',
    /*
    * LANGUAGE
    *
    * To translate the notifications messages into your language enter the two-letter language
    * code here.
    * Available languages are:
    *   en, cs, de, el, es, fa, fr, he, id, it, kr, lt, nl, no, nb, pl, pt, pt-BR, ru, th, tr.
    * If you want to add your own language find the variable called i18n below and follow the
    * instructions: it's quite simple as long as you can translate from one of the available
    * languages.
    */
    lang: 'en',
    /*
     * EMAIL SENDER NAME
     *
     * This is the name you will see as the sender of the email: if you leave it blank it will
     * default to your Google account name.
     */
    emailSenderName: 'Contacts Events Notifications',

  },
  notifications: {
    /*
     * HOUR OF THE NOTIFICATION
     *
     * Specify at which hour of the day would you like to receive the email notifications.
     * This must be an integer between 0 and 23. This will set and automatic trigger for
     * the script between e.g. 6 and 7 am.
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
      birthday: true,
      anniversary: false,
      custom: false
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
     * This is used in the plaintext part of emails only (invisible to email clients which display
     * the html part by default).
     */
    indentSize: 4,
    /*
     * GROUP ALL LABELS
     *
     * By default only the main emails and phone numbers (work, home, mobile, main) are displayed with their
     * own label: all the other special and/or custom emails and phone numbers are grouped into a single
     * "other" group. By setting this variable to false instead, every phone and email will be grouped
     * under its own label.
     */
    compactGrouping: true
  },
  developer: {
    /* NB: Users shouldn't need to (or want to) touch these settings. They are here for the
     *     convenience of developers/maintainers only.
     */
    version: '6.0.0',
    repoName: 'GioBonvi/GoogleContactsEventsNotifier'
  }
};

// User settings can be used to override one or more default properties by
// setting a UserProperty with name "settings.property" and value equal to the desired value (JSON-encoded).
// Example: PropertiesService.getUserProperties().setProperty('settings.user.lang', '"it"');
// For now this is only useful for developers e.g. by setting a user property with my personal email for the
// notification setting I can avoid changing the corresponding setting in the script each time I paste an
// updated version.
// In the future (for example this evolves into a full-fledged app or website) this could be used to store
// user preferences without altering the default ones.
const settings = updateSettings(defaultSettings, PropertiesService.getUserProperties().getProperties());

// #endregion SETTINGS

// #region CLASSES

/**
 * A priority enum.
 *
 * @readonly
 * @enum {Object.<string,number>}
 */
const Priority = {
  NONE: { name: 'None', value: 0 },
  INFO: { name: 'Info', value: 10 },
  WARNING: { name: 'Warning', value: 20 },
  ERROR: { name: 'Error', value: 30 },
  FATAL_ERROR: { name: 'Fatal error', value: 40 },
  MAX: { name: 'Max', value: 100 }
};

/**
 * Init a Log object, used to manage a collection of logEvents {time, text, priority}.
 *
 * @param {string} reportingEmailAddress - Email address the logs will be sent to when required.
 * @param {?Priority} [minimumPriority=Priority.INFO] - Logs with priority lower than this will not be recorded.
 * @param {?Priority} [emailMinimumPriority=Priority.ERROR] - If at least one log with priority greater than or
                                       equal to this is recorded an email with all the logs will be sent to the user.
 * @param {?boolean} [testing=false] - If this is true logging an event with Priority.FATAL_ERROR will not
 *                                     cause execution to stop.
 * @class
 */
class Log {
  constructor (reportingEmailAddress, minimumPriority, emailMinimumPriority, testing) {
    this.reportingEmailAddress = reportingEmailAddress;
    this.minimumPriority = minimumPriority || Priority.INFO;
    this.emailMinimumPriority = emailMinimumPriority || Priority.ERROR;
    this.testing = testing || false;
    /** @type {Object[]} */
    this.events = [];
  }

  /**
   * Store a new event in the log. The default priority is the lowest one (`INFO`).
   *
   * @param {!any} data - The data to be logged: best if a string, Objects get JSONized.
   * @param {?Priority} [priority=Priority.INFO] - Priority of the log event.
   */
  add (data, priority) {
    let text;

    priority = priority || Priority.INFO;
    if (typeof data === 'object') {
      text = JSON.stringify(data);
    } else if (typeof data !== 'string') {
      text = String(data);
    } else {
      text = data;
    }
    if (priority.value >= this.minimumPriority.value) {
      this.events.push(new LogEvent(new Date(), text, priority));
    }

    // Still log into the standard logger as a backup in case the program crashes.
    Logger.log(`${priority.name[0]}: ${text}`);

    // Throw an Error and interrupt the execution if the log event had FATAL_ERROR
    // priority and we are not in test mode.
    if (priority.value === Priority.FATAL_ERROR.value && !this.testing) {
      this.sendEmail();
      throw new Error(text);
    }
  }

  /**
   * Get the output of the log as an array of messages.
   *
   * @returns {string[]}
   */
  getOutput () {
    return this.events.map(e => e.toString());
  }

  /**
   * Verify if the log contains at least an event with priority equal to or greater than
   * the specified priority.
   *
   * @param {?Priority} priority - The numeric value representing the priority limit.
   * @returns {boolean}
   */
  containsMinimumPriority (priority) {
    let i;

    const { value } = priority === undefined ? this.minimumPriority : priority;

    for (i = 0; i < this.events.length; i++) {
      if (this.events[i].priority.value >= value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Send all the logs collected to the specified email.
   *
   * @param {?string} email - The email address of the recipient of the email: if not specified
   *                          this.reportingEmailAddress will be used.
   */
  sendEmail (email) {
    email = email || this.reportingEmailAddress;
    this.add('Sending logs via email.', Priority.INFO);
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Logs for Google Contacts Events Notifications',
        body: this.getOutput().join('\n'),
        name: 'Google Contacts Events Notifications'
      });
      this.add('Email sent.', Priority.INFO);
    } catch (err) {
      this.add('Failed to send the logs via email: ' + err.msg, Priority.ERROR);
    }
  }
}

class LogEvent {
  /**
   * A logged event.
   *
   * @param {Date} time - The time of the event.
   * @param {string} message - The message of the event.
   * @param {Priority} priority - The priority of the event.
   */
  constructor (time, message, priority) {
    this.time = time;
    this.message = message;
    this.priority = priority;
  }

  /**
   * Get a textual description of the LogEvent in this format
   * (P is the first letter of the priority):
   *
   *     [TIME] P: MESSAGE
   *
   * @returns {string} - The textual description of the event.
   */
  toString () {
    return `[${Utilities.formatDate(this.time, Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm:ss')} ${Session.getScriptTimeZone()}] ${this.priority.name[0]}: ${this.message}`;
  }
}

/**
 * @typedef {Object} EventDataPoint
 * @property {string} name - The full name of the contact.
 * @property {string} nickname - The nickname of the contact.
 * @property {Object.<string,string>[]} phoneNumbers - The data regarding the phone numbers of the contact
 * @property {string} phoneNumber.value - The phone number.
 * @property {string} phoneNumber.canonicalForm - The phone number without spaces and with the prefix.
 * @property {string} phoneNumber.type - The type of phone.
 * @property {Object.<string,string>[]} emailAddresses - The data regarding the email addresses of the contact
 * @property {string} emailAddress.value - The email address.
 * @property {string} emailAddress.type - The type of email address.
 * @property {string} photoURL - The URL of the profile image of the contact.
 * @property {string} event - The type of the event.
 * @property {string} event.date - The dictionary containing day, month and optionally the year (as numbers) of the event.
 * @property {string} event.type - The type (birthday, anniversary, custom) of the event.
 * @property {string} event.label - The label (birthday, anniversary, custom) of the event.
 */

class SimplifiedSemanticVersion {
  /**
   * An object representing a simplified semantic version number.
   *
   * It must be composed of:
   *
   * * three dot-separated positive integers (major version,
   *   minor version and patch number);
   * * optionally a pre-release identifier, prefixed by a hyphen;
   * * optionally a metadata identifier, prefixed by a plus sign;
   *
   * This differs from the official SemVer style because the pre-release
   * string is compared as a whole in version comparison instead of
   * being spliced into chunks.
   *
   * @param {!string} versionNumber - The version number to build the object with.
   *
   * @class
   */
  constructor (versionNumber) {
    // Extract the pieces of information from the given string.
    const matches = versionNumber.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+?))?(?:\+(.+))?$/);
    if (matches) {
      this.numbers = [];
      this.numbers[0] = parseInt(matches[1], 10);
      this.numbers[1] = parseInt(matches[2], 10);
      this.numbers[2] = parseInt(matches[3], 10);
      this.preRelease = [undefined, null].includes(matches[4]) ? '' : matches[4];
      this.metadata = [undefined, null].includes(matches[5]) ? '' : matches[5];
    } else {
      throw new Error(`The version number "${versionNumber}" is not valid!`);
    }
  }

  /**
   * Build the version number string from the data.
   *
   * @returns {string} - The version number of this version.
   */
  toString () {
    return this.numbers.join('.') +
      (this.preRelease !== '' ? `-${this.preRelease}` : '') +
      (this.metadata !== '' ? `+${this.metadata}` : '');
  }

  /**
   * Compare a semantic version number with another one.
   *
   * Order of comparison: major number, minor number, patch number,
   * preRelease string (ASCII comparison). Metadata do not influence
   * comparisons.
   *
   * @param {!SimplifiedSemanticVersion} comparedVersion - The version to compare.
   * @returns {number} - 1, 0 , -1 if this version number is greater than, equal to or smaller than the one passed as the parameter.
   */
  compare ({ numbers, preRelease }) {
    let i;
    for (i = 0; i < 3; i++) {
      if (this.numbers[i] !== numbers[i]) {
        return this.numbers[i] < numbers[i] ? -1 : 1;
      }
    }
    if (this.preRelease !== preRelease) {
      // Between two versions with the same numbers, one in pre-release and the
      // other not, the one in pre-release must be considered smaller.
      if (this.preRelease === '') {
        return 1;
      } else if (preRelease === '') {
        return -1;
      }
      return this.preRelease < preRelease ? -1 : 1;
    }
    return 0;
  }
}

/**
 * Enum for notification type.
 *
 * @readonly
 * @enum {number}
 */
var NotificationFormat = {
  PLAIN_TEXT: 0,
  HTML: 1
};

/**
 * An enum of plurals for eventTypes.
 *
 * @readonly
 * @enum {string}
 */
var eventTypeNamePlural = {
  birthday: 'birthdays',
  anniversary: 'anniversaries',
  custom: 'custom events'
};

class LocalCache {
  /**
   * Initialize a LocalCache object.
   *
   * A LocalCache object is used to store external resources which are used multiple
   * times to optimize the number of `UrlFetchApp.fetch()` calls.
   *
   * @class
   */
  constructor () {
    this.cache = {};
  }

  /**
   * Fetch an URL, optionally making more than one try.
   *
   * @param {!string} url - The URL which has to be fetched.
   * @param {?number} [tries=1] - Number of times to try the fetch operation before failing.
   * @returns {?Object} - The fetch response or null if the fetch failed.
   */
  fetch (url, tries) {
    let response;
    let i;

    tries = tries || 1;

    response = null;
    // Try fetching the data.
    for (i = 0; i < tries; i++) {
      try {
        response = UrlFetchApp.fetch(url);
        if (response.getResponseCode() !== 200) {
          throw new Error('Response code: ' + response.getResponseCode());
        }
        // Break the loop if the fetch was successful.
        break;
      } catch (error) {
        log.add('Fetch failed. URL: ' + url, Priority.WARNING);
        log.add('Error: ' + JSON.stringify(error, null, 2), Priority.WARNING);
        response = null;
        Utilities.sleep(1000);
      }
    }
    // Store the result in the cache and return it.
    this.cache[url] = response;
    return this.cache[url];
  }

  /**
   * Determine whether an url has already been cached.
   *
   * @param {!string} url - The URL to check.
   * @returns {boolean} - True if the cache contains an object for the URL, false otherwise.
   */
  isCached (url) {
    return !!this.cache[url];
  }

  /**
   * Retrieve an object from the cache.
   *
   * The object is loaded from the cache if present, otherwise it is fetched.
   *
   * @param {!string} url - The URL to retrieve.
   * @param {?number} tries - Number of times to try the fetch operation before failing (passed to `this.fetch()`).
   * @returns {Object} - The response object.
   */
  retrieve (url, tries) {
    if (this.isCached(url)) {
      return this.cache[url];
    } else {
      return this.fetch(url, tries);
    }
  }
}

// #endregion CLASSES

// #region GLOBAL VARIABLES

const loggedUserEmail = Session.getActiveUser().getEmail();

const log = new Log(loggedUserEmail, Priority.ERROR);

const version = new SimplifiedSemanticVersion(settings.developer.version);

const cache = new LocalCache();

// These events are available in the dropdown of the Google Contacts interface.
const MAIN_EVENT_TYPES = ['birthday', 'anniversary'];
// Any other event will fall into this type.
const OTHER_EVENT_TYPE = 'custom';

// https://pixabay.com/vectors/avatar-icon-placeholder-1577909/
// Pixabay license: free for commercial use, no attribution required, modification allowed
// image down-sized to 128x128 px, compressed to optimized 16 color PNG
const DEFAULT_PROFILE_IMG_BLOB = Utilities.newBlob(Utilities.base64Decode('iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAElBMVEWVu9+Ot92wzefJ3O/j7ff///+IuyMoAAACMElEQVR4Xu2XTXLCMAyF7RT2MvQASdPuIZA9gL3PNPb9r9LGLUwKAetF0wwL3i6Z0TeyZP1YJfXUUyZqvLkqN9ZuKjUSQaULUb7So+y34azjGEIdemphgJ6FP9oRCFiECxWgAx+XgE9CHZC5ML8GNBDAXQM8AliGAa2xE4jOoOshQEuCEERJkhhVIDGURXE2DNgJkhDVoIWQKAcoi1HtdAA3DPCTAdQtgHpMwPRBfPyLJK8FOUBezvKG8joM2It74nRdWQXhXNAOLgV8tMmHK57H/ZT7gUonAY9iS5MuWctkCPAgYPa6ToQAbwk7BSpxArgvxn4oycNa4S4kHMDaUoFGID56Lh48BNhntiO8nwCHztbmbILJXEy7+Xk4+srEi+Fzw3Ofys5K/z5dfx+u1LEqTRz3617czbd6OWnTx9Avp468ov7fU2deUco+nLU6H9n0/xI/+ZWOCENl6KkAqthXHaB0F1UBDUXvoBE5Dww1yEwEZ+QisFQgEw2bcR88wCcyj7A573gAD8QQi+KSC1gDSYDSMOcCGmDHRrZuOaDmAloCSgkpJz4gMdHTAooZKeglH7AWA4CbDNzlGR+wE5RCVCMGMEoBLwY5oOYD2gcFOD7APyZAIQAl9UCehX8ppgW/qd6Yrhl3P8hvrtnvHMBB051Ff5sCHHOT2PXtPYBNb/yabntxzJPmEWGyITdslZtozkJQZPyx1idzNkO9lZuttcdN9RY/cZmzEgZPPfUFwJ35yvTjuKsAAAAASUVORK5CYII='), 'image/png');

// These URLs are used to access the files in the repository or specific pages on GitHub.
const baseGitHubProjectURL = 'https://github.com/' + settings.developer.repoName + '/';
const baseGitHubApiURL = 'https://api.github.com/repos/' + settings.developer.repoName + '/';

// NB: When Google fixes their too-broad scope bug with ScriptApp, re-wrap this i18n
//     table in `eslint-*able comma-dangle` comments (see old git-commits to find it)
var i18n = {
  // For all languages, if a translation is not present the untranslated string
  // is returned, so just leave out translations which are the same as the English.

  // NB: If ever adding a lang which uses non-latin numbers functionality will need
  // to be added to handle that differently (arbitrary numbers, not just a small
  // selection, e.g. for age calculation).

  // An entry for 'en' marks it as a valid lang config-option, but leave it empty
  // to just return unaltered phrases.
  'en': {},
  'cs': {
    'Age': 'Věk',
    'Years': 'Let',
    'Events': 'Události',
    'Birthdays today': 'Narozeniny dnes',
    'Birthdays tomorrow': 'Narozeniny zítra',
    'Birthdays in {0} days': 'Narozeniny za {0} dní',
    'Anniversaries today': 'Výročí dnes',
    'Anniversaries tomorrow': 'Výročí zítra',
    'Anniversaries in {0} days': 'Výročí za {0} dní',
    'Custom events today': 'Jiné události dnes',
    'Custom events tomorrow': 'Jiné události zítra',
    'Custom events in {0} days': 'Jiné události za {0} dní',
    'Hey! Don\'t forget these events': 'Hej! Nezapomeň na tyto události',
    'version': 'verze',
    'dd-MM-yyyy': 'dd.MM.yyyy',
    'Mobile phone': 'Mobil',
    'Work phone': 'Telefon (pracovní)',
    'Home phone': 'Telefon (soukromý)',
    'Main phone': 'Telefon (hlavní)',
    'Other phone': 'Jiné telefonní číslo',
    'Home fax': 'Fax (soukromý)',
    'Work fax': 'Fax (pracovní)',
    'Google voice': 'Google voice',
    'Pager': 'Pager',
    'Home email': 'E-mail (soukromý)',
    'Work email': 'E-mail (pracovní)',
    'Other email': 'Jiné e-mailové adresy',
    'It looks like you are using an outdated version of this script': 'Vypadatá to, že používáte zastaralouv verzi skriptu',
    'You can find the latest one here': 'Poslední verzi najdete zde',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telefon (mobil)',
    'Work phone': 'Telefon (geschäftlich)',
    'Home phone': 'Telefon (privat)',
    'Main phone': 'Telefon (haupt)',
    'Other phone': 'Telefon (sonstige)',
    'Home fax': 'Fax (privat)',
    'Work fax': 'Fax (geschäftlich)',
    'Google voice': 'Google Voice',
    'Pager': 'Pager',
    'Home email': 'E-Mail (privat)',
    'Work email': 'E-Mail (geschäftlich)',
    'Other email': 'E-Mail (sonstige)',
    'It looks like you are using an outdated version of this script': 'Du scheinst eine veraltete Version dieses Skripts zu benutzen',
    'You can find the latest one here': 'Du findest die neuste Version hier', // Using feminime version of 'latest', because it refers to 'version'. There's possibility it won't fit into diffrent context.
  },
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
    'Hey! Don\'t forget these events': 'Και πού σαι! Μην ξεχάσεις αυτά τα γεγονότα',
    'version': 'εκδοχή',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Κινητό',
    'Work phone': 'Τηλέφωνο εργασίας',
    'Home phone': 'Τηλέφωνο οικίας',
    'Main phone': 'Κύριο τηλέφωνο',
    'Other phone': 'Άλλο τηλέφωνο',
    'Home fax': 'Φαξ οικίας',
    'Work fax': 'Φαξ εργασίας',
    'Google voice': 'Google voice',
    'Pager': 'Τηλεειδοποίηση',
    'Home email': 'Προσωπικό email',
    'Work email': 'Επαγγελματικό email',
    'Other email': 'Άλλο email',
    'It looks like you are using an outdated version of this script': 'Φαίνεται οτι χρησιμοποιείς μια παλαιότερη εκδοχή αυτόυ του script',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Celular',
    'Work phone': 'Teléfono del trabajo',
    'Home phone': 'Teléfono del hogar',
    'Main phone': 'Teléfono principal',
    'Other phone': 'Otro teléfono',
    'Home fax': 'Fax del hogar',
    'Work fax': 'Fax del trabajo',
    'Google voice': 'Google voice',
    'Pager': 'Buscapersonas',
    'Home email': 'Correo electrónico del hogar',
    'Work email': 'Correo electrónico del trabajo',
    'Other email': 'Otro correo electrónico',
    'It looks like you are using an outdated version of this script': 'Parece que estás usando una versión antigua de este script',
    'You can find the latest one here': 'Puedes encontrar la última aquí',
  },
  'fa': {
    'Age': 'سن',
    'Years': 'سال',
    'Events': 'رویدادها',
    'Birthdays today': 'تولدهای امروز',
    'Birthdays tomorrow': 'تولدهای فردا',
    'Birthdays in {0} days': 'تولدهای {0} روز آینده',
    'Anniversaries today': 'سالگردهای امروز',
    'Anniversaries tomorrow': 'سالگردهای فردا',
    'Anniversaries in {0} days': 'سالگردهای {0} روز آینده',
    'Custom events today': 'رویدادهای شخصی امروز',
    'Custom events tomorrow': 'رویدادهای شخصی فردا',
    'Custom events in {0} days': 'رویدادهای شخصی {0} روز آینده',
    'Hey! Don\'t forget these events': 'سلام! این رویدادها را فراموش نکن',
    'version': 'نسخه',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'شماره موبایل',
    'Work phone': 'شماره تلفن محل کار',
    'Home phone': 'شماره تلفن خانه',
    'Main phone': 'شماره تلفن اصلی',
    'Other phone': 'شماره تلفن دیگر',
    'Home fax': 'شماره فاکس خانه',
    'Work fax': 'شماره فاکس محل کار',
    'Google voice': 'وویس گوگل',
    'Pager': 'پیجر',
    'Home email': 'ایمیل خانه',
    'Work email': 'ایمیل محل کار',
    'Other email': 'ایمیل دیگر',
    'It looks like you are using an outdated version of this script': 'به نظر می رسد شما نسخه قدیمی این اسکریپت را استفاده می کنید',
    'You can find the latest one here': 'اینجا می توانید نسخه به روز را بیابید',
  },
  'fr': {
    'Age': 'Age',
    'Years': 'Années',
    'Events': 'Evénements',
    'Birthdays today': 'Anniversaires aujourd\'hui',
    'Birthdays tomorrow': 'Anniversaires demain',
    'Birthdays in {0} days': 'Anniversaires dans {0} jours',
    'Anniversaries today': 'Anniversaires aujourd\'hui',
    'Anniversaries tomorrow': 'Anniversaires demain',
    'Anniversaries in {0} days': 'Anniversaires dans {0} jours',
    'Custom events today': 'Autres événements aujourd\'hui',
    'Custom events tomorrow': 'Autres événements demain',
    'Custom events in {0} days': 'Autres événements dans {0} jours',
    'Hey! Don\'t forget these events': 'Hey ! N\'oubliez pas ces événements',
    'version': 'version',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Téléphone portable',
    'Work phone': 'Téléphone travail',
    'Home phone': 'Téléphone maison',
    'Main phone': 'Téléphone principale',
    'Other phone': 'Autre téléphone',
    'Home fax': 'Fax maison',
    'Work fax': 'Fax travail',
    'Google voice': 'Google voice',
    'Pager': 'Téléavertisseur',
    'Home email': 'Adresse mail personelle',
    'Work email': 'Adresse mail professionelle',
    'Other email': 'Autre adresse mail',
    'It looks like you are using an outdated version of this script': 'Il semblerait que vous utilisiez une ancienne version de ce script',
    'You can find the latest one here': 'Vous pouvez trouver la dernière version ici',
  },
  'he': {
    'Age': 'גיל',
    'Years': 'שנים',
    'Events': 'אירועים',
    'Birthdays today': 'ימי הולדת היום',
    'Birthdays tomorrow': 'ימי הולדת מחר',
    'Birthdays in {0} days': 'ימי הולדת בעוד {0} ימים',
    'Anniversaries today': 'ימי נישואין היום',
    'Anniversaries tomorrow': 'ימי נישואין מחר',
    'Anniversaries in {0} days': 'ימי נישואין בעוד {0} ימים',
    'Custom events today': 'אירועים מיוחדים היום',
    'Custom events tomorrow': 'אירועים מיוחדים מחר',
    'Custom events in {0} days': 'אירועים מיוחדים בעוד {0} ימים',
    'Hey! Don\'t forget these events': 'היי, אל תשכח את האירועים האלה!',
    'version': 'גרסה',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'טלפון נייד',
    'Work phone': 'טלפון בעבודה',
    'Home phone': 'טלפון בבית',
    'Main phone': 'מספר טלפון ראשי',
    'Other phone': 'טלפון אחר',
    'Home fax': 'פקס בבית',
    'Work fax': 'פקס בעבודה',
    'Google voice': 'Google voice',
    'Pager': 'זימונית',
    'Home email': 'מייל אישי',
    'Work email': 'מייל בעבודה',
    'Other email': 'כתובת מייל אחרת',
    'It looks like you are using an outdated version of this script': 'נראה שאתה משתמש בגרסה לא עדכנית של התוכנה',
    'You can find the latest one here': 'אתה יכול להוריד את הגרסה העדכנית כאן',
  },
  'id': {
    'Age': 'Usia',
    'Years': 'Tahun',
    'Events': 'Acara',
    'Birthdays today': 'Ulang tahun hari ini',
    'Birthdays tomorrow': 'Ulang tahun besok',
    'Birthdays in {0} days': 'Ulang tahun dalam {0} hari mendatang',
    'Anniversaries today': 'Hari jadi hari ini',
    'Anniversaries tomorrow': 'Hari jadi besok',
    'Anniversaries in {0} days': 'Hari jadi dalam {0} hari mendatang',
    'Custom events today': 'Acara khusus hari ini',
    'Custom events tomorrow': 'Acara khusus besok',
    'Custom events in {0} days': 'Acara khusus dalam {0} hari mendatang',
    'Hey! Don\'t forget these events': 'Hei! Jangan lupa acara ini',
    'version': 'versi',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telp. Selular',
    'Work phone': 'Telp. Kantor',
    'Home phone': 'Telp. Rumah',
    'Main phone': 'Telp. Utama',
    'Other phone': 'Telp. Lain',
    'Home fax': 'Faks. Rumah',
    'Work fax': 'Faks. Kantor',
    'Google voice': 'Google voice',
    'Pager': 'Pager',
    'Home email': 'Email Rumah',
    'Work email': 'Email Kantor',
    'Other email': 'Email Lain',
    'It looks like you are using an outdated version of this script': 'Sepertinya anda menggunakan versi lama dari skrip ini',
    'You can find the latest one here': 'Anda bisa menemukan versi terbaru di sini',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Cellulare',
    'Work phone': 'Telefono di lavoro',
    'Home phone': 'Telefono di casa',
    'Main phone': 'Telefono principale',
    'Other phone': 'Altro telefono',
    'Home fax': 'Fax di casa',
    'Work fax': 'Fax di lavoro',
    'Google voice': 'Google voice',
    'Pager': 'Cercapersone',
    'Home email': 'Email di casa',
    'Work email': 'Email di lavoro',
    'Other email': 'Altra email',
    'It looks like you are using an outdated version of this script': 'Sembra che tu stia usando una vecchia versione di questo script',
    'You can find the latest one here': 'Puoi trovare l\'ultima qui',
  },
  'kr': {
    'Age': '나이',
    'Years': '년도',
    'Events': '행사',
    'Birthdays today': '오늘 생일',
    'Birthdays tomorrow': '내일 생일',
    'Birthdays in {0} days': '{0}일 동안 생일',
    'Anniversaries today': '오늘 기념일',
    'Anniversaries tomorrow': '내일 기념일',
    'Anniversaries in {0} days': '{0}일 동안 기념일',
    'Custom events today': '오늘 지정된 행사',
    'Custom events tomorrow': '내일 지정된 행사',
    'Custom events in {0} days': '{0}일 동안 지정된 행사',
    'Hey! Don\'t forget these events': '이 행사들을 잊지 마세요!',
    'version': '버전',
    'dd-MM-yyyy': 'yyyy-MM-dd',
    'Mobile phone': '휴대폰',
    'Work phone': '직장 전화',
    'Home phone': '집 전화',
    'Main phone': '대표 전화',
    'Other phone': '기타 전화',
    'Home fax': '집 팩스',
    'Work fax': '직장 팩스',
    'Google voice': '구글 보이스',
    'Pager': '무선호출기',
    'Home email': '집 이메일',
    'Work email': '직장 이메일',
    'Other email': '기타 이메일',
    'It looks like you are using an outdated version of this script': '옛날 버전 스크립트를 사용중인것 같네요',
    'You can find the latest one here': '여기에서 최신버전을 찾을 수 있습니다',
  },
  'lt': {
    'Age': 'Amžius',
    'Years': 'Metai',
    'Events': 'Įvykiai',
    'Birthdays today': 'Šiandienos gimtadieniai',
    'Birthdays tomorrow': 'Rytojaus gimtadieniai',
    'Birthdays in {0} days': 'Gimtadieniai už {0} dienų',
    'Anniversaries today': 'Šiandienos jubiliejai',
    'Anniversaries tomorrow': 'Rytojaus jubiliejai',
    'Anniversaries in {0} days': 'Jubiliejai už {0} dienų',
    'Custom events today': 'Priskirti įvykiai šiandien',
    'Custom events tomorrow': 'Priskirti įvykiai rytoj',
    'Custom events in {0} days': 'Priskirti įvykiai už {0} dienų',
    'Hey! Don\'t forget these events': 'Hey! Neužmiršk šių įvykių',
    'version': 'versija',
    'dd-MM-yyyy': 'yyyy-MM-dd',
    'Mobile phone': 'Mobilus telefonas',
    'Work phone': 'Darbo telefonas',
    'Home phone': 'Namų telefonas',
    'Main phone': 'Pagrindinis telefonas',
    'Other phone': 'Kitas telefonas',
    'Home fax': 'Namų faksas',
    'Work fax': 'Darbo faksas',
    'Google voice': 'Google voice',
    'Pager': 'Peidžeris',
    'Home email': 'Namų elektroninis paštas',
    'Work email': 'Darbo elektroninis paštas',
    'Other email': 'Kitas elektroninis paštas',
    'It looks like you are using an outdated version of this script': 'Atrodo, kad jūs naudojate pasenusią šio skripto versiją',
    'You can find the latest one here': 'Naujausią galite rasti čia',
  },
  'nb': {
    'Age': 'Alder',
    'Years': 'År',
    'Events': 'Arrangementer',
    'Birthdays today': 'Bursdager idag',
    'Birthdays tomorrow': 'Bursdager imorgen',
    'Birthdays in {0} days': 'Bursdager om {0} dager',
    'Anniversaries today': 'Jubileer idag',
    'Anniversaries tomorrow': 'Jubileer imorgen',
    'Anniversaries in {0} days': 'Jubileer om {0} dager',
    'Custom events today': 'Egendefinerte arrangementer idag',
    'Custom events tomorrow': 'Egendefinerte arrangementer imorgen',
    'Custom events in {0} days': 'Egendefinerte arrangementer om {0} dager',
    'Hey! Don\'t forget these events': 'Hei! Ikke glem disse arrangementene',
    'version': 'versjon',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobiltelefon',
    'Work phone': 'Arbeidstelefon',
    'Home phone': 'Hjemmetelefon',
    'Main phone': 'Hovedtelefon',
    'Other phone': 'Annen telefon',
    'Home fax': 'Hjemme faks',
    'Work fax': 'Arbeids faks',
    'Google voice': 'Google voice',
    'Pager': 'Personsøker ',
    'Home email': 'Hjemme e-post',
    'Work email': 'Arbeids e-post',
    'Other email': 'Annen e-post',
    'It looks like you are using an outdated version of this script': 'Det ser ut til at du bruker utdatert versjon av dette skriptet',
    'You can find the latest one here': 'Du kan finne den nyeste her',
  },
  'nl': {
    'Age': 'Leeftijd',
    'Years': 'Jaar',
    'Events': 'Gebeurtenissen',
    'Birthdays today': 'Verjaardagen vandaag',
    'Birthdays tomorrow': 'Verjaardagen morgen',
    'Birthdays in {0} days': 'Verjaardagen over {0} dagen',
    'Anniversaries today': 'Jubilea vandaag',
    'Anniversaries tomorrow': 'Jubilea morgen',
    'Anniversaries in {0} days': 'Jubilea over {0} dagen',
    'Custom events today': 'Aangepaste gebeurtenissen vandaag',
    'Custom events tomorrow': 'Aangepaste gebeurtenissen morgen',
    'Custom events in {0} days': 'Aangepaste gebeurtenissen over {0} dagen',
    'Hey! Don\'t forget these events': 'Hey! Vergeet volgende gebeurtenissen niet',
    'version': 'versie',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobiel',
    'Work phone': 'Tel. werk',
    'Home phone': 'Tel. thuis',
    'Main phone': 'Algemeen telefoonnummer',
    'Other phone': 'Ander telefoonnummer',
    'Home fax': 'Fax thuis',
    'Work fax': 'Fax werk',
    'Google voice': 'Google voice',
    'Pager': 'Pager',
    'Home email': 'E-mail thuis',
    'Work email': 'E-mail werk',
    'Other email': 'Ander e-mailadres',
    'It looks like you are using an outdated version of this script': 'Het lijkt erop alsof je een verouderde versie van dit script gebruikt.',
    'You can find the latest one here': 'Je kunt de laatste versie hier vinden',
  },
  'no': {
    'Age': 'Alder',
    'Years': 'År',
    'Events': 'Arrangementer',
    'Birthdays today': 'Bursdager i dag',
    'Birthdays tomorrow': 'Bursdager i morgen',
    'Birthdays in {0} days': 'Bursdager om {0} dager',
    'Anniversaries today': 'Jubileum i dag',
    'Anniversaries tomorrow': 'Jubileum i morgen',
    'Anniversaries in {0} days': 'Jubileum om {0} dager',
    'Custom events today': 'Egendefinerte hendelser i dag',
    'Custom events tomorrow': 'Egendefinerte hendelser i morgen',
    'Custom events in {0} days': 'Egendefinerte hendelser om {0} dager',
    'Hey! Don\'t forget these events': 'Hei! Ikke glem disse arrangementene',
    'version': 'versjon',
    'dd-MM-yyyy': 'dd.MM.yyyy',
    'Mobile phone': 'Mobil',
    'Work phone': 'Jobbtelefon',
    'Home phone': 'Hjemtelefon',
    'Main phone': 'Hovedtelefon',
    'Other phone': 'Annen telefon',
    'Home fax': 'Hjemmefax',
    'Work fax': 'Jobbfax',
    'Google voice': 'Google voice',
    'Pager': 'Personsøker',
    'Home email': 'Hjem e-post',
    'Work email': 'Jobb e-post',
    'Other email': 'Annen e-post',
    'It looks like you are using an outdated version of this script': 'Det ser ut som du bruker en gammel versjon av dette scriptet',
    'You can find the latest one here': 'Du kan finne nyeste versjon her',
  },
  'pl': {
    'Age': 'Wiek',
    'Years': 'Lat(a)',
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
    'dd-MM-yyyy': 'dd.MM.yyyy',
    'Mobile phone': 'Telefon',
    'Work phone': 'Telefon (służbowy)',
    'Home phone': 'Telefon (stacjonarny)',
    'Main phone': 'Telefon (główny)',
    'Other phone': 'Inne numery',
    'Home fax': 'Fax (domowy)',
    'Work fax': 'Fax (służbowy)',
    'Google voice': 'Google voice',
    'Pager': 'Pager',
    'Home email': 'E-mail (prywatny)',
    'Work email': 'E-mail (służbowy)',
    'Other email': 'Inne adresy e-mail',
    'It looks like you are using an outdated version of this script': 'Wygląda na to, że używasz nieaktualnej wersji skryptu',
    'You can find the latest one here': 'Najnowszą możesz znaleźć tutaj', // Using feminime version of 'latest', because it refers to 'version'. There's possibility it won't fit into diffrent context.
  },
  'pt': {
    'Age': 'Idade',
    'Years': 'Anos',
    'Events': 'Eventos',
    'Birthdays today': 'Aniversários hoje',
    'Birthdays tomorrow': 'Aniversários amanhã',
    'Birthdays in {0} days': 'Aniversários em {0} dias',
    'Anniversaries today': 'Aniversários hoje',
    'Anniversaries tomorrow': 'Aniversários amanhã',
    'Anniversaries in {0} days': 'Aniversários em {0} dias',
    'Custom events today': 'Eventos personalizados hoje',
    'Custom events tomorrow': 'Eventos personalizados amanhã',
    'Custom events in {0} days': 'Eventos personalizados em {0} dias',
    'Hey! Don\'t forget these events': 'Hey! Não te esqueças destes eventos',
    'version': 'versão',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Número de telemóvel',
    'Work phone': 'Número de trabalho',
    'Home phone': 'Número de casa',
    'Main phone': 'Número principal',
    'Other phone': 'Outro número',
    'Home fax': 'Fax de casa',
    'Work fax': 'Fax de trabalho',
    'Google voice': 'Google voice',
    'Pager': 'Pager',
    'Home email': 'Email de casa',
    'Work email': 'Email de trabalho',
    'Other email': 'Outro email',
    'It looks like you are using an outdated version of this script': 'Parece que tens uma versão desatualizada deste script',
    'You can find the latest one here': 'Podes encontrar a última versão aqui',
  },
  'pt-BR': {
    'Age': 'Idade',
    'Years': 'Anos',
    'Events': 'Eventos',
    'Birthdays today': 'Aniversários hoje',
    'Birthdays tomorrow': 'Aniversários amanhã',
    'Birthdays in {0} days': 'Aniversários em {0} dias',
    'Anniversaries today': 'Aniversários hoje',
    'Anniversaries tomorrow': 'Aniversários amanhã',
    'Anniversaries in {0} days': 'Aniversários em {0} dias',
    'Custom events today': 'Eventos personalizados hoje',
    'Custom events tomorrow': 'Eventos personalizados amanhã',
    'Custom events in {0} days': 'Eventos personalizados em {0} dias',
    'Hey! Don\'t forget these events': 'Ei! Não se esqueça destes eventos',
    'version': 'versão',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Celular',
    'Work phone': 'Telefone de trabalho',
    'Home phone': 'Telefone residencial',
    'Main phone': 'Telefone principal',
    'Other phone': 'Outro telefone',
    'Home fax': 'Fax residencial',
    'Work fax': 'Fax profissional',
    'Google voice': 'Google voice',
    'Pager': 'Pager',
    'Home email': 'Email residencial',
    'Work email': 'Email profissional',
    'Other email': 'Outro email',
    'It looks like you are using an outdated version of this script': 'Parece que você está usando uma versão desatualizada deste script',
    'You can find the latest one here': 'Você pode encontrar a última versão aqui',
  },
  'ru': {
    'Age': 'Возраст',
    'Years': 'Лет',
    'Events': 'События',
    'Birthdays today': 'Дни рождения сегодня',
    'Birthdays tomorrow': 'Дни рождения завтра',
    'Birthdays in {0} days': 'Дни рождения через {0} дней',
    'Anniversaries today': 'Юбилей сегодня',
    'Anniversaries tomorrow': 'Юбилей завтра',
    'Anniversaries in {0} days': 'Юбилей через {0} дней',
    'Custom events today': 'Специальное событие сегодня',
    'Custom events tomorrow': 'Специальное событие завтра',
    'Custom events in {0} days': 'Специальное событие через {0} дней',
    'Hey! Don\'t forget these events': 'Эй! Не забудь об этих мероприятиях',
    'version': 'версия',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Мобильный телефон',
    'Work phone': 'Рабочий телефон',
    'Home phone': 'Домашний телефон',
    'Main phone': 'Основной телефон',
    'Other phone': 'Другой телефон',
    'Home fax': 'Домашний факс',
    'Work fax': 'Рабочий факс',
    'Google voice': 'Google voice',
    'Pager': 'Пейджер',
    'Home email': 'Домашний email',
    'Work email': 'Рабочий email',
    'Other email': 'Другой email',
    'It looks like you are using an outdated version of this script': 'Похоже вы используете устаревшую версию этой программы',
    'You can find the latest one here': 'Вы можете найти последнюю версию здесь',
  },
  'th': {
    'Age': 'อายุ',
    'Years': 'ปี',
    'Events': 'อีเวนท์',
    'Birthdays today': 'วันเกิดวันนี้',
    'Birthdays tomorrow': 'วันเกิดพรุ่งนี้',
    'Birthdays in {0} days': 'วันเกิดในอีก {0} วัน',
    'Anniversaries today': 'วันครบรอบวันนี้',
    'Anniversaries tomorrow': 'วันครบรอบพรุ่งนี้',
    'Anniversaries in {0} days': 'วันครบรอบในอีก {0} วัน',
    'Custom events today': 'อีเวนท์ที่กำหนดเองวันนี้',
    'Custom events tomorrow': 'อีเวนท์ที่กำหนดเองวันพรุ่งนี้',
    'Custom events in {0} days': 'อีเวนท์ที่กำหนดเองในอีก {0} วัน',
    'Hey! Don\'t forget these events': 'เฮ้! อย่าลืมอีเวน์เหล่านี้ล่ะ',
    'version': 'เวอร์ชั่น',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'เบอร์โทรศัพท์',
    'Work phone': 'เบอร์โทรศัพท์ที่ทำงาน',
    'Home phone': 'เบอร์โทรศัพท์บ้าน',
    'Main phone': 'เบอร์โทรศัพท์หลัก',
    'Other phone': 'เบอร์โทรศัพท์อื่นๆ',
    'Home fax': 'แฟกซ์บ้าน',
    'Work fax': 'แฟกซ์ที่ทำงาน',
    'Google voice': 'Google voice',
    'Pager': 'เพจเจอร์',
    'Home email': 'อีเมลบ้าน',
    'Work email': 'อีเมลที่ทำงาน',
    'Other email': 'อีเมลอื่นๆ',
    'It looks like you are using an outdated version of this script': 'ดูเหมือนว่าคุณกำลังใช้เวอร์ชั่นเก่าสำหรับสคริปท์นี้',
    'You can find the latest one here': 'คุณสามารถหาเวอร์ชั่นใหม่ได้ที่นี่',
  },
  'tr': {
    'Age': 'Yaş',
    'Years': 'Yıl',
    'Events': 'Etkinlikler',
    'Birthdays today': 'Bugünkü doğum günleri',
    'Birthdays tomorrow': 'Yarınki doğum günleri',
    'Birthdays in {0} days': '{0} gün içindeki doğum günleri',
    'Anniversaries today': 'Bugünkü yıldönümleri',
    'Anniversaries tomorrow': 'Yarınki yıldönümleri',
    'Anniversaries in {0} days': '{0} gün içindeki yıldönümleri',
    'Custom events today': 'Bugünkü özel etkinlikler',
    'Custom events tomorrow': 'Yarınki özel etkinlikler',
    'Custom events in {0} days': '{0} gün içindeki özel etkinlikler',
    'Hey! Don\'t forget these events': 'Hey! Bu etkinlikleri unutma!',
    'version': 'sürüm',
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Cep telefonu',
    'Work phone': 'İş telefonu',
    'Home phone': 'Ev telefonu',
    'Main phone': 'Birincil telefon',
    'Other phone': 'Diğer telefon',
    'Home fax': 'Fax (ev)',
    'Work fax': 'Fax (iş)',
    'Google voice': 'Google voice',
    'Pager': 'Çağrı cihazı',
    'Home email': 'E-mail (ev)',
    'Work email': 'E-mail (iş)',
    'Other email': 'Email (diğer)',
    'It looks like you are using an outdated version of this script': 'Görünüşe göre bu betiğin eski bir sürümünü kullanıyorsunuz',
    'You can find the latest one here': 'En son sürümü burada bulabilirsiniz',
  },
  /* To add a language:
  '[lang-code]': {
    '[first phrase]': '[translation here]',
    '[second phrase]': '[translation here]',
    ...
    // Note: 'dd-MM-yyyy' should NOT be translated (especially in a different alphabet). You just need to reorder
    //       dd (day) MM (month) and yyyy (year) in the order your language usually represents dates.
    //       Examples:
    //         USA:   (month/day/year) should be 'MM-dd-yyyy'
    //         Italy: (day/month/year) should be 'dd-MM-yyyy'
  }
  */
};

// #endregion GLOBAL VARIABLES

// #region EXTENDED NATIVE PROTOTYPES

if ([undefined, null].includes(Date.prototype.addDays)) {
  /**
   * Generate a new date adding a number of days to a given date.
   *
   * @param {number} days Number of days to be added to the date.
   * @author AnthonyWJones
   * @see {@link https://stackoverflow.com/a/563442|Stackoverflow}
   */
  Date.prototype.addDays = function (days) { // eslint-disable-line no-extend-native
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
  };
}

if ([undefined, null].includes(String.prototype.format)) {
  /**
   * Format a string, replace {1}, {2}, etc with their corresponding trailing args.
   *
   * * Examples:
   *         'This is a {0}'.format('test') -> 'This is a test.'
   *         'This {0} a {1}'.format('is') -> 'This is a {1}.'
   *
   * @param {...!string} arguments
   * @returns {string}
   */
  String.prototype.format = function () { // eslint-disable-line no-extend-native
    var args;

    args = arguments;
    return this.replace(/\{(\d+)\}/g, function (match, number) {
      return [undefined, null].includes(args[number]) ? match : args[number];
    });
  };
}

if ([undefined, null].includes(String.prototype.replaceAll)) {
  /**
   * Replace all occurrences of a substring (not a regex).
   *
   * @param {!string} substr - The substring to be replaced.
   * @param {!string} repl - The replacement for the substring.
   * @returns {string} - The string with the substrings replaced.
   */
  String.prototype.replaceAll = function (substr, repl) { // eslint-disable-line no-extend-native
    return this.split(substr).join(repl);
  };
}

// #endregion EXTENDED NATIVE PROTOTYPES

// #region HELPER FUNCTIONS

/**
 * Get the translation of a string.
 *
 * If the language or the chosen string is invalid return the string itthis.
 *
 * @param {!string} str - String to attempt translation for.
 * @returns {string}
 */
function _ (str) {
  return i18n[settings.user.lang][str] || str;
}

/**
 * Replace a `Field.Label` object with its "beautified" text representation.
 *
 * @param {?string} label - The internal label to transform to readable form.
 * @returns {string}
 */
function beautifyLabel (label) {
  switch (String(label)) {
    /*
     * Phone labels:
     */
    case 'MOBILE_PHONE':
    case 'WORK_PHONE':
    case 'HOME_PHONE':
    case 'MAIN_PHONE':
    case 'HOME_FAX':
    case 'WORK_FAX':
    case 'GOOGLE_VOICE':
    case 'PAGER':
    case 'OTHER_PHONE': // Fake label for output.
    /*
     * (falls through)
     * Email labels:
     */
    case 'HOME_EMAIL':
    case 'WORK_EMAIL':
    case 'OTHER_EMAIL': // Fake label for output.
    /*
     * (falls through)
     * Event labels:
     */
    case 'OTHER':
    case 'BIRTHDAY':
    case 'ANNIVERSARY':
      return _(label[0] + label.slice(1).replaceAll('_', ' ').toLocaleLowerCase());
    /*
     * Custom labels:
     */
    case 'CUSTOM:' + label.slice('CUSTOM:'.length):
      // Don't interfere with the upper/lower-casing for this one though
      return label.slice('CUSTOM:'.length);
    default:
      return String(label);
  }
}

/**
 * Replace HTML special characters in a string with their HTML-escaped equivalent.
 *
 * @param {?string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
function htmlEscape (str) {
  str = str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if the script is not updated to the latest version.
 *
 * The latest version number is obtained from the GitHub API and compared with the
 * script's one.
 *
 * If there is any problem retrieving the latest version number false is returned.
 *
 * @returns {boolean} - True if the script version is lower than the latest released one, false otherwise.
 */
function isRunningOutdatedVersion () {
  var response, latestVersion, fetchTries;

  // Retrieve the last version info.
  fetchTries = 2;
  try {
    response = cache.retrieve(baseGitHubApiURL + 'releases/latest', fetchTries);
    if (response === null) {
      throw new Error('');
    }
  } catch (err) {
    log.add('Unable to get the latest version number after ' + fetchTries + ' tries', Priority.WARNING);
    return false;
  }
  // Parse the info for the version number.
  try {
    response = JSON.parse(response);
    if (typeof response !== 'object') {
      throw new Error('');
    }
  } catch (err) {
    log.add('Unable to get the latest version number: failed to parse the API response as JSON object', Priority.WARNING);
    return false;
  }
  latestVersion = response.tag_name;
  if (typeof latestVersion !== 'string' || latestVersion.length === 0) {
    log.add('Unable to get the latest version number: there was no valid tag_name string in the API response.', Priority.WARNING);
    return false;
  }
  if (latestVersion.substring(0, 1) === 'v') {
    latestVersion = latestVersion.substring(1);
  }

  // Compare the versions.
  try {
    return (version).compare(new SimplifiedSemanticVersion(latestVersion)) === -1;
  } catch (err) {
    log.add(err.message, Priority.WARNING);
    return false;
  }
}

/**
 * Set a property in a nested object to a value.
 *
 * @param obj - The object to be modified.
 * @param path - The path to the property to be modified (e.g. "root.leaf.prop")
 * @param value - THe value to be assigned to the proeprty
 * @author bpmason1
 * @see {@link https://stackoverflow.com/a/18937118/3047294|Stackoverflow}
 */
function setObjectByPath (obj, path, value) {
  var schema = obj;
  var pList = path.split('.');
  var len = pList.length;
  for (var i = 0; i < len - 1; i++) {
    var elem = pList[i];
    if (!schema[elem]) {
      schema[elem] = {};
    }
    schema = schema[elem];
  }
  schema[pList[len - 1]] = value;
}

// #endregion HELPER FUNCTIONS

// #region MAIN FUNCTIONS

/**
 * Extract the important data (names, dates, profile images) from a list of people.
 *
 * Only people with events of the correct type and with a matching date will be considered.
 *
 * @param {Object[]} people - The list of Person objects from which the data will be extracted.
 * @param {Date[]} allowedEventDates - The list of dates which will be used to filter the data.
 * @param {String[]} allowedEventTypes - The list of event types which will be used to filter the data.
 *
 * @returns {Object.<string,EventDataPoint[]>[]} - The useful data extracted from the contacts.
 *          It is a list, containing one element for each eventDate.
 *          Each element is an Object with all the eventTypes as keys.
 *          Each key contains a list of EventDataPoints.
 */
function getEventDataFromPeople (people, allowedEventDates, allowedEventTypes) {
  // The data object is a list of objects (one for every date), each containing
  // a list of events for each event type.
  var singleData = {};
  MAIN_EVENT_TYPES.concat(OTHER_EVENT_TYPE).forEach(eventType => { singleData[eventType] = []; });
  var data = [];
  for (let i = 0; i < allowedEventDates.length; i++) {
    // Use JSON parse and stringify to perform a shallow copy of the singleData object.
    data.push(JSON.parse(JSON.stringify(singleData)));
  }

  for (const person of people) {
    // Identify the primary name of the person.
    let name = 'UNKNOWN';
    if (person.names) {
      for (const nameData of person.names) {
        if (nameData.metadata.primary && nameData.displayName) {
          name = nameData.displayName;
          break;
        }
      }
    }

    // Identify the primary nickname of the person.
    let nickname = null;
    if (person.nicknames) {
      for (const nicknameData of person.nicknames) {
        if (nicknameData.metadata.primary && nicknameData.value) {
          nickname = nicknameData.value;
          break;
        }
      }
    }

    // Identify the phone numbers of the person.
    const phoneNumbers = [];
    if (person.phoneNumbers) {
      for (const phoneData of person.phoneNumbers) {
        phoneNumbers.push({
          value: phoneData.value,
          canonicalForm: phoneData.canonicalForm,
          type: phoneData.type
        });
      }
    }

    // Identify the email addresses of the person.
    const emailAddresses = [];
    if (person.emailAddresses) {
      for (const emailData of person.emailAddresses) {
        emailAddresses.push({
          value: emailData.value,
          type: emailData.type
        });
      }
    }

    // Identify the URL of the primary profile image of the person.
    let photoURL = null;
    if (person.photos) {
      for (const photoData of person.photos) {
        if (photoData.metadata.primary && photoData.url) {
          photoURL = photoData.url;
          break;
        }
      }
    }

    // Birthdays are not listed under the generic events category and have slightly different
    // fields (missing type and formattedType fields), so if a birthday is present we take it,
    // change it to have the same fields of a generic event and place it in the events list
    // for later processing.
    if (person.birthdays) {
      for (const birthdayData of person.birthdays) {
        if (birthdayData.metadata.primary && birthdayData.date) {
          birthdayData.type = 'birthday';
          // Insertion in the event list.
          if (person.events) {
            person.events.push(birthdayData);
          } else {
            person.events = [birthdayData];
          }
          break;
        }
      }
    }

    // Identify which events of this person fall on one of the eventDates and store the corresponding data.
    if (person.events) {
      for (const event of person.events) {
        // Filter unwanted event types.
        if (allowedEventTypes.includes(event.type) || (allowedEventTypes.includes(OTHER_EVENT_TYPE) && !MAIN_EVENT_TYPES.includes(event.type))) {
          for (let i = 0; i < allowedEventDates.length; i++) {
            // Filter unwanted event dates.
            if (event.date.day === allowedEventDates[i].getDate() && event.date.month === (allowedEventDates[i].getMonth() + 1)) {
              const eventType = MAIN_EVENT_TYPES.includes(event.type) ? event.type : OTHER_EVENT_TYPE;
              const dataPoint = {
                name,
                nickname,
                photoURL,
                event: {
                  type: eventType,
                  label: event.formattedType,
                  date: event.date
                },
                phoneNumbers,
                emailAddresses
              };
              data[i][eventType].push(dataPoint);
            }
          }
        }
      }
    }
  }

  return data;
}

/**
 * Retrieves all the user contacts from the People API.
 *
 * @returns {Object[]} - The list of Person objects from the API.
 */
function fetchPeople () {
  var pageToken = '';
  var people = [];

  log.add('Fetching contacts from People API.');

  while (pageToken !== null) {
    // Merge all the pages returned by the People API in a single list of people.
    const { peoplePage, nextPageToken } = fetchPeoplePage(pageToken);
    pageToken = nextPageToken;
    people.push(...peoplePage);
  }

  log.add(`Fetched ${people.length} contacts from Pepole API.`);

  return people;
}

/**
 * Retrieves one page of the user contacts from the People API.
 *
 * @param {?string} pageToken - Token to use the API pagination feature. If null the first page is returned.
 *
 * @returns {Object} content - The content from the API.
 * @returns {Object[]} content.pepoplePage - The list of Person objects from the page.
 * @returns {?String} content.nextPageToken - The token for the next page. If no next page exists this is null.
 */
function fetchPeoplePage (pageToken) {
  log.add('Fetching one page from People API.');

  const response = People.People.Connections.list('people/me', {
    personFields: 'names,nicknames,birthdays,events,photos,phoneNumbers,emailAddresses',
    pageSize: 1000, // Maximum page size.
    sortOrder: 'LAST_NAME_ASCENDING', // Only for simplicity/debugging.
    pageToken: pageToken || ''
  });

  return {
    peoplePage: response.connections,
    nextPageToken: response.nextPageToken || null
  };
}

/**
 * Generate a settings object updating a previous settings object with some new properties and/or values.
 *
 * @param {Object} baseSettings - The previous setting object.
 * @param {Object.<string,string>} props - A dictionary wit the properties to update: the keys
 *                                must be of the form "root.leaf.prop" and the values must be the
 *                                JSON-econded value of the property.
 *
 * @returns {Object} - The new settings object.
 */
function updateSettings (baseSettings, props) {
  var newSettings = JSON.parse(JSON.stringify(baseSettings)); // Object clone.

  for (const propPath in props) {
    const splitPropPath = propPath.split('.');
    if (splitPropPath[0] === 'settings') {
      try {
        setObjectByPath(newSettings, splitPropPath.slice(1).join('.'), JSON.parse(props[propPath]));
      } catch (err) {
        log.add('Failed to parse the property ' + propPath, Priority.WARNING);
      }
    }
  }

  return newSettings;
}

// #endregion MAIN FUNCTIONS

// #region EMAIL NOTIFICATION

/**
 * Send an email notification to the user with the description of all the events
 * in the next days, according to the settings.
 *
 * @param {?Object} [localSettings=settings] - The settings object. If null the global settings are used.
 * @param {?Date} [forceDate=new Date()] - The date used as "now". If null the current time will be used.
 */
function sendEmailNotification (localSettings, forceDate) { // eslint-disable-line no-unused-vars
  localSettings = localSettings || settings;
  const now = forceDate || new Date();

  const targetDates = localSettings.notifications.anticipateDays.map(daysInterval => now.addDays(daysInterval));
  const wantedTypes = Object.keys(localSettings.notifications.eventTypes)
    .filter(x => localSettings.notifications.eventTypes[x]);
  const allContacts = fetchPeople();
  const eventData = getEventDataFromPeople(allContacts, targetDates, wantedTypes);
  const emailData = buildEmailNotification(eventData, localSettings, now);

  if (emailData) {
    log.add('Sending the email notification...');
    MailApp.sendEmail({
      to: localSettings.user.notificationEmail,
      subject: emailData.subject,
      body: emailData.body,
      htmlBody: emailData.htmlBody,
      inlineImages: emailData.inlineImages,
      name: localSettings.user.senderName
    });
  } else {
    log.add('No events detected: email notification not sent.');
  }

  // Send the logs if necessary.
  if (log.containsMinimumPriority()) {
    log.sendEmail();
  }
}

/**
 * Generate the content of an email to the user containing a list of the events
 * of his/her contacts scheduled on a given date.
 *
 * @param {Object.<string,EventDataPoint[]>[]} - The event data returned by getEventDataFromPeople().
 * @param {number[]} anticipateDays - List of days into the future to check for events (as in: "x days from today").
 * @param {Object} localSettings - The settings object.
 * @param {?Date} forceDate - If this value is not null it's used as 'now'.
 *
 * @returns {Object.<string,any>} - The content of the email.
 */
function buildEmailNotification (eventData, localSettings, forceDate) {
  var eventDataList, subjectPrefix, subjectBuilder, subject, bodyPrefix, bodySuffixes,
    inlineImages, plainTextBodyBuilder, htmlBodyBuilder;

  log.add('generateEmailNotification() running.');

  const now = forceDate || new Date();
  log.add('Date used as "now": ' + now);

  // Count how many events are present (if 0 then the notification is empty).
  eventDataList = [];
  for (let i = 0; i < eventData.length; i++) {
    const data = eventData[i];
    for (const eventType in data) {
      eventDataList.push(...data[eventType]);
    }
  }
  if (eventDataList.length === 0) {
    log.add('No events listed. Exiting now.');
    return null;
  }
  log.add('Found ' + eventDataList.length + ' events: building the email notification.');

  // Start building the email notification text.

  // SUBJECT
  subjectPrefix = _('Events') + ': ';
  subjectBuilder = [...new Set(eventDataList.map(ed => ed.name))];
  subject = subjectPrefix + subjectBuilder.join(' - ');
  // An error is thrown if the subject of the email is longer than 250 characters.
  const maxSubjectLength = 250;
  const ellipsis = '...';
  if (subject.length > maxSubjectLength) {
    subject = subject.substr(0, maxSubjectLength - ellipsis.length) + ellipsis;
  }

  // BODY
  // This goes at the top of the email.
  bodyPrefix = _('Hey! Don\'t forget these events') + ':';
  // This goes to the bottom of the email.
  bodySuffixes = [
    _('Google Contacts Events Notifier') + ' (' + _('version') + ' ' + version.toString() + ')',
    _('It looks like you are using an outdated version of this script') + '.',
    _('You can find the latest one here')
  ];
  // This will contain the blobs of the profile images.
  inlineImages = {};

  // The email is built in two versions: plain text and HTML.
  plainTextBodyBuilder = [];
  htmlBodyBuilder = [];

  // Push the prefix in the builder.
  plainTextBodyBuilder.push(bodyPrefix, '\n');
  htmlBodyBuilder.push('<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
    `<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${localSettings.user.lang}" lang="${localSettings.user.lang}"><head><title>Google Contacts Events Notifier</title>`,
    '<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8" /><meta http-equiv="Content-Style-Type" content="text/css" />',
    '</head><body style="margin-top:0;margin-bottom:0;margin-left:0;margin-right:0;padding-top:0;padding-bottom:0;padding-left:0;padding-right:0;">',
    '<table border="0" cellpadding="8" cellspacing="0" style="width:100%;">',
    '<tr><td colspan="2" style="font-size:small; font-family: Arial, sans-serif;"><b>', htmlEscape(bodyPrefix), '</b></td></tr>');

  // Build the "true" content of the email: the list of events with all the details.
  // Iterate on all the dates...
  for (let dateIndex = 0; dateIndex < localSettings.notifications.anticipateDays.length; dateIndex++) {
    const daysInterval = localSettings.notifications.anticipateDays[dateIndex];
    const date = now.addDays(daysInterval);
    const formattedDate = Utilities.formatDate(date, localSettings.notifications.timeZone, _('dd-MM-yyyy'));

    // ... and for each date iterate on all the event types...
    for (const eventType in eventData[dateIndex]) {
      // Check if there are events for this date and event type combination or skip it.
      log.add(`Found ${eventData[dateIndex][eventType].length} ${eventTypeNamePlural[eventType]} on ${formattedDate}.`);
      if (eventData[dateIndex][eventType].length === 0) {
        break;
      }

      // Build the headers for this date and event type combination and push them in the builder.
      let whenIsIt = eventTypeNamePlural[eventType].charAt(0).toUpperCase() + eventTypeNamePlural[eventType].slice(1);
      switch (daysInterval) {
        case 0:
          whenIsIt += ' today';
          break;
        case 1:
          whenIsIt += ' tomorrow';
          break;
        default:
          whenIsIt += ' in {0} days';
      }
      whenIsIt = _(whenIsIt).format(daysInterval) + ' (' + formattedDate + ')';
      // Push it to the builder.
      plainTextBodyBuilder.push('\n * ' + whenIsIt + ':\n');
      htmlBodyBuilder.push(`<tr><td colspan="2" style="font-size:large; font-family: Arial, sans-serif;"><b>${whenIsIt}</b></td></tr>`);

      // Generate the list of events.
      const plaintextLines = eventData[dateIndex][eventType]
        .map(data => getEmailNotificationLine(data, inlineImages, NotificationFormat.PLAIN_TEXT, now, localSettings));
      const htmlLines = eventData[dateIndex][eventType]
        .map(data => getEmailNotificationLine(data, inlineImages, NotificationFormat.HTML, now, localSettings));
      // Push them to the builder.
      plainTextBodyBuilder.push(...plaintextLines);
      htmlBodyBuilder.push(...htmlLines);
    }
  }

  // Build the footer of the email and push it to the builder.
  const runningOutdatedVersion = isRunningOutdatedVersion();
  plainTextBodyBuilder.push(
    '\n\n ' + bodySuffixes[0] + '\n ',
    '\n',
    runningOutdatedVersion
      ? bodySuffixes[1] + ' ' + bodySuffixes[2] + ':\n' + baseGitHubProjectURL + 'releases/latest' + '\n '
      : ''
  );
  htmlBodyBuilder.push(
    `</table><hr/><p style="text-align:center;font-size:smaller"><a href="${baseGitHubProjectURL}">${htmlEscape(bodySuffixes[0])}</a>`,
    runningOutdatedVersion
      ? `<br/><br/><b>${htmlEscape(bodySuffixes[1])} <a href="${baseGitHubProjectURL}releases/latest">${htmlEscape(bodySuffixes[2])}</a>.</b></p>`
      : '</p>',
    '</body></html>'
  );

  // Generate the body.
  const plainTextBody = plainTextBodyBuilder.join('');
  const htmlBody = htmlBodyBuilder.join('');

  // Finally return all the contents.
  return {
    subject,
    body: plainTextBody,
    htmlBody,
    inlineImages
  };
}

/**
 * Describe the EventDataPoint with a string of the specified format.
 *
 * @param {EventDataPoint} data - The event data to describe.
 * @param {Object.<string,Blob>} inlineImages - The object containing the inline images.
 * @param {NotificationFormat} format - The format of the notification.
 * @param {Date} now - The date used as "now".
 * @param {Object} localSettings  - The settings object.
 *
 * @returns {string} - The description of the data point.
 */
function getEmailNotificationLine (data, inlineImages, format, now, localSettings) {
  var line, indent, imgCount, collected;

  line = [];
  indent = Array(localSettings.notifications.indentSize + 1).join(' ');

  // Start line.
  switch (format) {
    case NotificationFormat.PLAIN_TEXT:
      line.push(indent);
      break;
    case NotificationFormat.HTML:
      line.push('<tr>');
  }

  // Profile photo.
  switch (format) {
    case NotificationFormat.HTML:
      imgCount = Object.keys(inlineImages).length;
      try {
        if (data.photoURL) {
          inlineImages['contact-img-' + imgCount] = cache.retrieve(data.photoURL, 3);
        } else {
          inlineImages['contact-img-' + imgCount] = DEFAULT_PROFILE_IMG_BLOB.copyBlob();
        }
      } catch (err) {
        log.add('Unable to get the profile picture with URL ' + data.photoURL, Priority.WARNING);
        log.add('Error:' + JSON.stringify(err, null, 2), Priority.WARNING);
        // Use the default profile image as a fallback.
        inlineImages['contact-img-' + imgCount] = DEFAULT_PROFILE_IMG_BLOB.copyBlob().setName('contact-img-' + imgCount);
      } finally {
        // The image is shown even if an error happened thanks to the fallback.
        line.push('<td style="width:1px;" valign="top"><img src="cid:contact-img-' + imgCount + '" style="height:3em;" alt="" /></td><td valign="top">');
      }
  }

  // Custom label
  if (data.event.type === OTHER_EVENT_TYPE) {
    const eventLabel = data.event.label || 'Other';
    switch (format) {
      case NotificationFormat.PLAIN_TEXT:
        line.push('<', beautifyLabel(eventLabel), '> ');
        break;
      case NotificationFormat.HTML:
        line.push(htmlEscape('<' + beautifyLabel(eventLabel) + '> '));
    }
  }

  // Full name.
  switch (format) {
    case NotificationFormat.PLAIN_TEXT:
      line.push(data.name);
      break;
    case NotificationFormat.HTML:
      line.push(htmlEscape(data.name));
  }

  // Nickname.
  if (data.nickname) {
    switch (format) {
      case NotificationFormat.PLAIN_TEXT:
        line.push(' "', data.nickname, '"');
        break;
      case NotificationFormat.HTML:
        line.push(htmlEscape(' "' + data.nickname + '"'));
    }
  }

  // Age/years passed.
  if (data.event.date.year) {
    if (data.event.type === 'birthday') {
      switch (format) {
        case NotificationFormat.PLAIN_TEXT:
          line.push(' - ', _('Age'), ': ');
          break;
        case NotificationFormat.HTML:
          line.push(' - ', htmlEscape(_('Age')), ': ');
      }
    } else {
      switch (format) {
        case NotificationFormat.PLAIN_TEXT:
          line.push(' - ', _('Years'), ': ');
          break;
        case NotificationFormat.HTML:
          line.push(' - ', htmlEscape(_('Years')), ': ');
      }
    }
    line.push(Math.round(now.getFullYear() - data.event.date.year));
  }

  switch (format) {
    case NotificationFormat.HTML:
      line.push('<br/>');
  }

  // Emails and phones are grouped by label: these are the default main label groups.
  collected = {
    HOME_EMAIL: [],
    WORK_EMAIL: [],
    OTHER_EMAIL: [],
    MAIN_PHONE: [],
    HOME_PHONE: [],
    WORK_PHONE: [],
    MOBILE_PHONE: [],
    OTHER_PHONE: []
  };
  // Collect and group the email addresses.
  data.emailAddresses.forEach((emailData, i) => {
    if (localSettings.notifications.maxEmailsCount < 0 || i < localSettings.notifications.maxEmailsCount) {
      const label = emailData.type;
      const type = `${label}_EMAIL`.toLocaleUpperCase();
      const emailAddr = emailData.value;
      if (![undefined, null].includes(collected[type])) {
        // Store the value if the label group is already defined.
        collected[type].push({ display: emailAddr, link: `mailto:${emailAddr}` });
      } else if (!localSettings.notifications.compactGrouping) {
        // Define a new label groups different from the main ones only if compactGrouping is set to false.
        collected[label] = [{ display: emailAddr, link: `mailto:${emailAddr}` }];
      } else {
        // Store any other label in the OTHER_EMAIL label group.
        collected.OTHER_EMAIL.push({ display: emailAddr, link: `mailto:${emailAddr}` });
      }
    }
  });
  // Collect and group the phone numbers.
  data.phoneNumbers.forEach((phoneData, i) => {
    if (localSettings.notifications.maxPhonesCount < 0 || i < localSettings.notifications.maxPhonesCount) {
      const label = phoneData.type;
      const type = `${label}_PHONE`.toLocaleUpperCase();
      if (![undefined, null].includes(collected[type])) {
        // Store the value if the label group is already defined.
        collected[type].push({ display: phoneData.value, link: `tel:${phoneData.canonicalForm}` });
      } else if (!localSettings.notifications.compactGrouping) {
        // Define a new label groups different from the main ones only if compactGrouping is set to false.
        collected[label] = [{ display: phoneData.value, link: `tel:${phoneData.canonicalForm}` }];
      } else {
        // Store any other label in the OTHER_EMAIL label group.
        collected.OTHER_PHONE.push({ display: phoneData.value, link: `tel:${phoneData.canonicalForm}` });
      }
    }
  });

  // If there is at least an email address/phone number to be added to the email...
  const totalPhonesEmailCount = Object.keys(collected).reduce((acc, label) => { return acc + collected[label].length; }, 0);
  if (totalPhonesEmailCount >= 1) {
    // ...generate the text from the grouped emails and phone numbers.

    line.push('(');

    const contactTypes = [];

    // Iterate over the types.
    for (const label in collected) {
      if (collected[label].length > 0) {
        const contactType = [];
        // For each type store the label...
        switch (format) {
          case NotificationFormat.PLAIN_TEXT:
            contactType.push(beautifyLabel(label));
            break;
          case NotificationFormat.HTML:
            contactType.push(htmlEscape(beautifyLabel(label)));
        }
        contactType.push(': ');
        // ... and the dash-separated list of values.
        const values = collected[label].map(val => {
          switch (format) {
            case NotificationFormat.PLAIN_TEXT:
              return val.display;
            case NotificationFormat.HTML:
              return '<a href="' + htmlEscape(val.link) + '">' + htmlEscape(val.display) + '</a>';
          }
        });
        contactType.push(values.join(' - '));

        // Store the contact type as a string
        contactTypes.push(contactType.join(''));
      }
    }
    // Store the contact types in the line as comma-separated strings.
    line.push(contactTypes.join(', '));
    line.push(')');
  }

  // Finish line.
  switch (format) {
    case NotificationFormat.PLAIN_TEXT:
      line.push('\n');
      break;
    case NotificationFormat.HTML:
      line.push('</td></tr>');
  }

  // Store the line as a string.
  return line.join('');
}

// #endregion EMAIL NOTIFICATION

// #region EMAIL NOTIFICATION SERVICE

/**
 * Start the notification service.
 */
function notifStart () { // eslint-disable-line no-unused-vars
  // TODO: Implement settings validation.

  // Delete old triggers.
  notifStop();

  // Add a new trigger.
  try {
    const triggerId = ScriptApp.newTrigger('sendEmailNotification')
      .timeBased()
      .atHour(settings.notifications.hour)
      .everyDays(1)
      .inTimezone(settings.notifications.timeZone)
      .create()
      .getUniqueId();
    log.add(`Created trigger: ${triggerId}`, Priority.INFO);
  } catch (err) {
    log.add('Failed to start the notification service: make sure that settings.notifications.timeZone contains a valid value.', Priority.FATAL_ERROR);
  }
  log.add('Notification service started.', Priority.INFO);
}

/**
 * Stop the notification service.
 */
function notifStop () {
  // Delete all the triggers.
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (
      trigger.getHandlerFunction() === 'sendEmailNotification' &&
      trigger.getEventType() === ScriptApp.EventType.CLOCK
    ) {
      log.add('Deleting trigger: ' + trigger.getUniqueId(), Priority.INFO);
      ScriptApp.deleteTrigger(trigger);
    }
  }
  log.add('Notification service stopped.', Priority.INFO);
}

/**
 * Check if notification service is running.
 */
function notifStatus () { // eslint-disable-line no-unused-vars
  var output = 'The notification service is ';
  if (ScriptApp.getProjectTriggers().filter(trigger =>
    trigger.getHandlerFunction() === 'sendEmailNotification' &&
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  ).length === 0) {
    output += 'not ';
  }
  output += 'running.';
  log.add(output);
  log.sendEmail();
}

// #endregion EMAIL NOTIFICATION SERVICE
