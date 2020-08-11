/* global Logger MailApp People Session Utilities */

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

// #endregion CLASSES

// #region GLOBAL VARIABLES

const loggedUserEmail = Session.getActiveUser().getEmail();

const log = new Log(loggedUserEmail, Priority.ERROR);

// These events are available in the dropdown of the Google Contacts interface.
const MAIN_EVENT_TYPES = ['birthday', 'anniversary'];
// Any other event will fall into this type.
const OTHER_EVENT_TYPE = 'custom';

// #endregion GLOBAL VARIABLES

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
