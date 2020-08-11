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

// #endregion CLASSES

// #region GLOBAL VARIABLES

const loggedUserEmail = Session.getActiveUser().getEmail();

const log = new Log(loggedUserEmail, Priority.ERROR);

// #endregion GLOBAL VARIABLES

// #region MAIN FUNCTIONS

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
    personFields: 'names,birthdays,events,photos',
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
