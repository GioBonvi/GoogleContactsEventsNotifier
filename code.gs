/* global Logger MailApp People Session UrlFetchApp Utilities */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
/* eslint comma-dangle: ["error", "only-multiline"] */
/* eslint quote-props: off */

// #region SETTINGS

const defaultSettings = {
  user: {
    lang: 'en'
  },
  notifications: {
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

// TODO: Implement overridable settings with local properties.
var settings = defaultSettings;

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

// TODO: Add translations.
const i18n = {
  'en': {}
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

// #endregion MAIN FUNCTIONS
