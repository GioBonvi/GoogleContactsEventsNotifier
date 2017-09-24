/* global Logger Plus ScriptApp ContactsApp Utilities Calendar UrlFetchApp MailApp Session */

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
     * Replace this fake Gmail address with the Gmail (or G Suite/Google Apps) address of your
     * own Google Account. This is needed to retrieve information about your contacts.
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
     * Available languages are: en, el, es, it, de, id, pl, fr.
     * If you want to add your own language find the variable called i18n below and follow the
     * instructions: it's quite simple as long as you can translate from one of the available
     * languages.
     */
    lang: 'en',
    /*
     * ACCESS GOOGLE+ FOR EXTRA CONTACT-INFORMATION
     *
     * This specifies that it is OK to attempt augmenting the contacts-information with
     * information found via your Google+ connections. If in doubt just leave this set to 'true'
     * because this script will silently ignore Google+ if it is not able to provide useful
     * information anyway. This option is mainly for users who do not use Google+ at all, and
     * don't want to allow this script access to an extra API for no reason (and it will make the
     * script use fewer API-calls, which is faster).
     */
    accessGooglePlus: true
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
      ANNIVERSARY: false,
      CUSTOM: false
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
       * Note: filterLevel has precedence over this setting! For example if you set filterLevel
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
  },
  developer: {
    /* NB: Users shouldn't need to (or want to) touch these settings. They are here for the
     *     convenience of developers/maintainers only.
     */
    version: '3.2.0-alpha',
    repoName: 'GioBonvi/GoogleContactsEventsNotifier',
    gitHubBranch: 'development'
  }
};

/*
 * There is no need to edit anything below this line.
 * The script will work if you inserted valid values up
 * until here, however feel free to take a peek at the code ;)
 */

// CLASSES

/**
 * Initialize an empty contact.
 * A Contact object holds the data about a contact collected from multiple sources.
 *
 * @class
 */
function Contact () {
  /** @type {?string} */
  this.contactId = null;
  /** @type {?string} */
  this.gPlusId = null;
  /** @type {ContactDataDC} */
  this.data = new ContactDataDC(
    null, // Name.
    null, // Nickname.
    null  // Profile image URL.
  );
  /** @type {EmailAddressDC[]} */
  this.emails = [];
  /** @type {PhoneNumberDC[]} */
  this.phones = [];
  /** @type {EventDC[]} */
  this.events = [];
}

/**
 * Extract all the available data from the raw event object and store them in the Contact.
 *
 * @param {Object} rawEvent - The object containing all the data about the event, obtained
 *                            from the Google Calendar API.
 */
Contact.prototype.getInfoFromRawEvent = function (rawEvent) {
  var eventData, eventDate, eventLabel;

  log.add('Extracting info from raw event object...', 'info');

  if (!rawEvent.gadget || !rawEvent.gadget.preferences) {
    log.add(rawEvent, 'info');
    log.add('The structure of this event cannot be parsed.', 'error');
  }
  eventData = rawEvent.gadget.preferences;

  // The raw event can contain the full name and profile photo of the contact (no nickname).
  this.data.merge(new ContactDataDC(
    eventData['goo.contactsFullName'],  // Name.
    null,                               // Nickname.
    eventData['goo.contactsPhotoUrl']   // Profile image URL.
  ));
  // The raw event contains an email of the contact, but without label.
  this.addToField('emails', new EmailAddressDC(
    null,                               // Label.
    eventData['goo.contactsEmail']      // Email address.
  ));
  // The raw event contains the type, day and month of the event, but not the year.
  eventDate = /^(\d\d\d\d)-(\d\d)-(\d\d)$/.exec(rawEvent.start.date);
  if (eventDate) {
    eventLabel = eventData['goo.contactsEventType'];
    // Custom events have an additional field containing the custom name of the event.
    if (eventLabel === 'CUSTOM' && typeof eventData['goo.contactsCustomEventType']) {
      eventLabel = eventData['goo.contactsCustomEventType'];
    }
    this.addToField('events', new EventDC(
      eventLabel,                                                   // Label.
      null,                                                         // Year.
      (eventDate[2] !== '00' ? parseInt(eventDate[2], 10) : null),  // Month.
      (eventDate[3] !== '00' ? parseInt(eventDate[3], 10) : null)   // Day.
    ));
  }
  // Collect info from the contactId if not already collected and if contactsContactId exists.
  if (this.contactId === null && eventData['goo.contactsContactId']) {
    this.getInfoFromContact(eventData['goo.contactsContactId']);
  }
  // Collect info from the gPlusId if not already collected and if contactsProfileId exists.
  if (this.gPlusId === null && eventData['goo.contactsProfileId']) {
    this.getInfoFromGPlus(eventData['goo.contactsProfileId']);
  }
};

/**
 * Update the Contact with info collect from a Google Contact.
 *
 * Some raw events will contain a Google Contact ID which gives access
 * to a bunch of new data about the contact.
 * This data is used to update the information collected until now.
 *
 * @param {string} contactId - The id from which to collect the data.
 */
Contact.prototype.getInfoFromContact = function (contactId) {
  var self, googleContact;

  self = this;

  log.add('Extracting info from Google Contact...', 'info');

  googleContact = ContactsApp.getContactById('http://www.google.com/m8/feeds/contacts/' + encodeURIComponent(settings.user.googleEmail) + '/base/' + encodeURIComponent(contactId));
  if (googleContact === null) {
    log.add('Invalid Google Contact ID: ' + contactId, 'warning');
    return;
  }

  self.contactId = contactId;

  // Contact identification data.
  self.data.merge(new ContactDataDC(
    googleContact.getFullName(),  // Name.
    googleContact.getNickname(),  // Nickname.
    null                          // Profile image URL.
  ));

  // Events.
  googleContact.getDates().forEach(function (dateField) {
    self.addToField('events', new EventDC(
      String(dateField.getLabel()),
      dateField.getYear(),
      monthToInt(dateField.getMonth()) + 1,
      dateField.getDay()
    ));
  });

  // Email addresses.
  googleContact.getEmails().forEach(function (emailField, i) {
    if (settings.notifications.maxEmailsCount === -1 || i < settings.notifications.maxEmailsCount) {
      self.addToField('emails', new EmailAddressDC(
        String(emailField.getLabel()),
        emailField.getAddress()
      ));
    }
  });

  // Phone numbers.
  googleContact.getPhones().forEach(function (phoneField, i) {
    if (settings.notifications.maxPhonesCount === -1 || i < settings.notifications.maxPhonesCount) {
      self.addToField('phones', new PhoneNumberDC(
        String(phoneField.getLabel()),
        phoneField.getPhoneNumber()
      ));
    }
  });
};

/**
 * Update the Contact with info collected from a Google+ Profile.
 *
 * Some raw events will contain a Google Plus Profile ID which
 * gives access to a bunch of new data about the contact.
 * This data is used to update the information collected until now.
 *
 * @param {string} gPlusProfileId - The id from which to collect the data.
 */
Contact.prototype.getInfoFromGPlus = function (gPlusProfileId) {
  var gPlusProfile, birthdayDate;

  if (!settings.user.accessGooglePlus) {
    log.add('Not extracting info from Google Plus Profile, as per configuration.', 'info');
    return;
  }

  log.add('Extracting info from Google Plus Profile...', 'info');
  try {
    gPlusProfile = Plus.People.get(gPlusProfileId);
    if (gPlusProfile === null) {
      throw new Error('');
    }
  } catch (err) {
    log.add('Invalid GPlus Profile ID: ' + gPlusProfileId, 'warning');
    return;
  }

  this.gPlusId = gPlusProfileId;

  this.data.merge(new ContactDataDC(
    gPlusProfile.name.formatted,  // Name.
    gPlusProfile.nickname,        // Nickname.
    gPlusProfile.image.url        // Profile image URL.
  ));

  /* A Google Plus Profile can have a birthday field in the form of "YYYY-MM-DD",
   * but part of the date can be missing, replaced by a bunch of zeroes
   * (most frequently the year).
   */
  if (gPlusProfile.birthday && gPlusProfile.birthday !== '0000-00-00') {
    birthdayDate = /^(\d\d\d\d)-(\d\d)-(\d\d)$/.exec(gPlusProfile.birthday);
    if (birthdayDate) {
      this.addToField('events', new EventDC(
        'BIRTHDAY',                                                           // Label.
        (birthdayDate[1] !== '0000' ? parseInt(birthdayDate[1], 10) : null),  // Year.
        (birthdayDate[2] !== '00' ? parseInt(birthdayDate[2], 10) : null),    // Month.
        (birthdayDate[3] !== '00' ? parseInt(birthdayDate[3], 10) : null)     // Day.
      ));
    }
  }
};

/**
 * This method is used to insert a new DataCollector into an array of
 * DataCollectors.
 * For example take 'EventDC e' and 'EventDC[] arr'; This method checks
 * all the elements of 'arr': if it finds one that is compatible with 'e'
 * it merges 'e' into that element, otherwise, if no element in the array
 * is compatible or if the array is empty, it just adds 'e' at the end of
 * the array.
 *
 * @param {string} field - The name of the field in which to insert the object.
 * @param {DataCollector} incData - The object to insert.
 */
Contact.prototype.addToField = function (field, incData) {
  var merged;

  // incData must have at least one non-empty property.
  if (
    Object.keys(incData.prop).length === 0 ||
    Object.keys(incData.prop)
    .filter(function (key) { return !incData.isPropEmpty(key); })
    .length === 0
  ) {
    return;
  }

  // Try to find a non-conflicting object to merge with in the given field.
  merged = false;
  this[field].forEach(function (data) {
    if (!merged && !data.isConflicting(incData)) {
      data.merge(incData);
      merged = true;
    }
  });
  // If incData could not be merged simply append it to the field.
  if (!merged) {
    this[field].push(incData);
  }
};

/**
 * Generate a list of text lines (of the given format - e.g. 'plain', 'html')
 * each describing an event of the contact of the type specified on the date
 * specified.
 *
 * @param {string} type - The type of the event.
 * @param {Date} date - The date of the event.
 * @param {string} format - The format of the text line.
 * @returns {string[]} - A list of the plain text descriptions of the events.
 */
Contact.prototype.getLines = function (type, date, format) {
  var self;

  self = this;
  return self.events.filter(function (event) {
    var typeMatch;
    switch (event.getProp('label')) {
      // Your own birthday is marked as 'SELF'.
      case 'SELF':
        // falls through
      case 'BIRTHDAY':
        typeMatch = (type === 'BIRTHDAY');
        break;
      case 'ANNIVERSARY':
        typeMatch = (type === 'ANNIVERSARY');
        break;
      default:
        typeMatch = (type === 'CUSTOM');
    }
    return typeMatch && event.getProp('day') === date.getDate() && event.getProp('month') === (date.getMonth() + 1);
  }).map(function (event) {
    var line, imgCount;

    line = [];
    // Start line.
    switch (format) {
      case 'plain':
        line.push(indent);
        break;
      case 'html':
        line.push('<li>');
    }
    // Profile photo.
    switch (format) {
      case 'html':
        imgCount = Object.keys(inlineImages).length;
        try {
          inlineImages['contact-img-' + imgCount] = UrlFetchApp.fetch(self.data.getProp('photoURL')).getBlob().setName('contact-img-' + imgCount);
          line.push('<img src="cid:contact-img-' + imgCount + '" style="height:1.4em;margin-right:0.4em" />');
        } catch (err) {
          log.add('Unable to get the profile picture', 'warning');
        }
    }
    // Custom label
    if (type === 'CUSTOM') {
      switch (format) {
        case 'plain':
          line.push('<', beautifyLabel(event.getProp('label')), '> ');
          break;
        case 'html':
          line.push(htmlEscape('<' + beautifyLabel(event.getProp('label')) + '> '));
      }
    }
    // Full name.
    switch (format) {
      case 'plain':
        line.push(self.data.getProp('fullName'));
        break;
      case 'html':
        line.push(htmlEscape(self.data.getProp('fullName')));
    }
    // Nickname.
    if (!self.data.isPropEmpty('nickname')) {
      switch (format) {
        case 'plain':
          line.push(' "', self.data.getProp('nickname'), '"');
          break;
        case 'html':
          line.push(htmlEscape(' "' + self.data.getProp('nickname') + '"'));
      }
    }
    // Age/years passed.
    if (!event.isPropEmpty('year')) {
      if (type === 'BIRTHDAY') {
        switch (format) {
          case 'plain':
            line.push(' - ', _('Age'), ': ');
            break;
          case 'html':
            line.push(' - ', htmlEscape(_('Age')), ': ');
        }
      } else {
        switch (format) {
          case 'plain':
            line.push(' - ', _('Years'), ': ');
            break;
          case 'html':
            line.push(' - ', htmlEscape(_('Years')), ': ');
        }
      }
      line.push(Math.round(date.getYear() - event.getProp('year')));
    }
    // Email addresses and phone numbers.
    if (self.emails.length + self.phones.length) {
      var collected;

      // Emails and phones are grouped by label.
      collected = {
        HOME_EMAIL: [],
        WORK_EMAIL: [],
        OTHER_EMAIL: [],
        HOME_PHONE: [],
        WORK_PHONE: [],
        MOBILE_PHONE: [],
        OTHER_PHONE: []
      };
      line.push(' (');
      // Collect and group the email addresses.
      self.emails.forEach(function (email) {
        var label, emailAddr;

        label = email.getProp('label');
        emailAddr = email.getProp('address');
        switch (label) {
          case 'HOME_EMAIL':
          case 'WORK_EMAIL':
            collected[label].push(emailAddr);
            break;
          default:
            collected.OTHER_EMAIL.push(emailAddr);
        }
      });
      // Collect and group the phone numbers.
      self.phones.forEach(function (phone) {
        var label, phoneNum;

        label = phone.getProp('label');
        phoneNum = phone.getProp('number');
        switch (label) {
          case 'HOME_PHONE':
          case 'WORK_PHONE':
          case 'MOBILE_PHONE':
            collected[label].push(phoneNum);
            break;
          default:
            collected.OTHER_PHONE.push(phoneNum);
        }
      });
      // Generate the text from the grouped emails and phone numbers..
      line.push(
        ['HOME_EMAIL', 'WORK_EMAIL', 'OTHER_EMAIL', 'HOME_PHONE', 'WORK_PHONE', 'MOBILE_PHONE', 'OTHER_PHONE'].map(function (label) {
          var output;

          if (collected[label].length) {
            switch (format) {
              case 'plain':
                output = beautifyLabel(label);
                break;
              case 'html':
                output = htmlEscape(beautifyLabel(label));
            }
            return output + ': ' + collected[label].map(function (val) {
              var buffer;

              switch (format) {
                case 'plain':
                  return val;
                case 'html':
                  buffer = '<a href="';
                  if (label.match(/_EMAIL$/)) {
                    buffer += 'mailto';
                  } else if (label.match(/_PHONE$/)) {
                    buffer += 'tel';
                  }
                  return buffer + ':' + htmlEscape(val) + '">' + htmlEscape(val) + '</a>';
              }
            }).join(' - ');
          }
        }).filter(function (val) {
          return val;
        }).join(', ')
      );
      line.push(')');
    }
    // Finish line.
    switch (format) {
      case 'html':
        line.push('</li>');
    }
    return line.join('');
  });
};

/**
 * DataCollector is a structure used to collect data about any "object" (an event, an
 * email address, a phone number...) from multiple incomplete sources.
 * For example the raw event could contain the day and month of the birthday, while
 * the Google Contact could hold the year as well. DataCollector can be used to accumulate
 * the data in multiple takes: each take updates the values that were left empty by the
 * previous ones until all info have been collected.
 *
 * Each DataCollector object can contain an arbitrary number of properties in the form of
 * name -> value, stored in the prop object.
 * Empty properties have null value.
 *
 * DataCollector is an abstract class. Each data type should have its own implementation
 * (EventDC, EmailAddressDC, PhoneNumberDC).
 *
 * @class
 */
var DataCollector = function () {
  if (this.constructor === DataCollector) {
    throw new Error('DataCollector is an abstract class and cannot be instantiated!');
  }
  /** @type {Object.<string,string>} */
  this.prop = {};
};

/**
 * Get the value of a given property.
 *
 * @param {string} key - The name of the property.
 * @returns {?string} - The value of the property.
 */
DataCollector.prototype.getProp = function (key) {
  return this.prop[key];
};

/**
 * Set a given property to a certain value.
 * If the value is undefined or an empty string it's replaced by null.
 *
 * @param {string} key - The name of the property.
 * @param {?string} value - The value of the property.
 */
DataCollector.prototype.setProp = function (key, value) {
  this.prop[key] = (typeof value !== 'undefined' && value !== '' ? value : null);
};

/**
 * Determines whether a give property is empty or not.
 *
 * @param {string} key - The name of the property.
 * @returns {boolean} - True if the property is empty, false otherwise.
 */
DataCollector.prototype.isPropEmpty = function (key) {
  return this.prop[key] === null;
};

/**
 * Detect whether two DataCollectors have the same constructor or not.
 *
 * Examples:
 * DC_1 = new EventDC(...a, b, c...)
 * DC_2 = new EventDC(...x, y, z...)
 * DC_3 = new EmailAddressDC(...a, b, c...)
 * DC_4 = new EmailAddressDC(...x, y, z...)
 *
 * DC_1.isCompatible(DC_2) -> true
 * DC_1.isCompatible(DC_3) -> false
 * DC_1.isCompatible(DC_4) -> false
 *
 * @param {DataCollector} otherData - The object to compare the current one with.
 * @returns {boolean} - True if the tow objects have the same constructor, false otherwise.
 */
DataCollector.prototype.isCompatible = function (otherData) {
  // Only same-implementation objects of DataCollector can be compared.
  return this.constructor === otherData.constructor;
};

/**
 * Detect whether two DataCollectors are conflicting or not.
 *
 * Examples:
 * DC_1 = {name='test', number=3, field=null}
 * DC_2 = {name=null, number=3, field=3}
 * DC_3 = {name='test', number=null, field=1}
 * DC_4 = {name='test', number=3, otherfield=null} (using different DC implementation)
 *
 * DC_1.isConflicting(DC_2) -> false
 * DC_1.isConflicting(DC_3) -> false
 * DC_1.isConflicting(DC_4) -> false (not .isCompatible())
 * DC_2.isConflicting(DC_3) -> true (conflict on field)
 *
 * @param {DataCollector} otherData - The object to compare the current one with.
 * @returns {boolean} - True if the two objects are conflicting, false otherwise.
 */
DataCollector.prototype.isConflicting = function (otherData) {
  var self;

  self = this;
  if (!self.isCompatible(otherData)) {
    return false;
  }
  return Object.keys(otherData.prop)
    .filter(function (key) {
      return !self.isPropEmpty(key) && !otherData.isPropEmpty(key) && self.getProp(key) !== otherData.getProp(key);
    }).length !== 0;
};

/**
 * Merge two DataCollector objects, filling the empty properties of the
 * first one with the non-empty ones of the second one.
 *
 * Examples:
 * DC_1 = {name='test', number=3, field=null}
 * DC_2 = {name=null, number=3, field=3}
 * DC_2 = {name='test', number=null, field=1}
 *
 * DC_1.merge(DC_2) -> {name='test', number=3, field=3}
 * DC_1.isCompatible(DC_3) -> {name='test', number=3, field=1}
 * DC_2.isCompatible(DC_3) -> INCOMPATIBLE
 *
 * @param {DataCollector} otherDataCollector - The object to merge into the current one.
 */
DataCollector.prototype.merge = function (otherDataCollector) {
  var self;

  self = this;
  if (!self.isCompatible(otherDataCollector)) {
    throw new Error('Trying to merge two different implementations of IncompleteData!');
  }
  // Fill each empty key of the current DataCollector with the value from the given one.
  Object.keys(self.prop).forEach(function (key) {
    if (self.isPropEmpty(key)) {
      self.setProp(key, otherDataCollector.getProp(key));
    }
  });
};

// Implementations of DataCollector.

/**
 * Init an Event Data Collector.
 *
 * @param {string} label - Label of the event (BIRTHDAY, ANNIVERSARY, ANYTHING_ELSE...)
 * @param {number} year - Year of the event.
 * @param {number} month - Month of the event.
 * @param {number} day - Day of the event.
 */
var EventDC = function (label, year, month, day) {
  DataCollector.apply(this);
  this.setProp('label', label);
  this.setProp('year', year);
  this.setProp('month', month);
  this.setProp('day', day);
};
EventDC.prototype = Object.create(DataCollector.prototype);
EventDC.prototype.constructor = EventDC;

/**
 * Init an EmailAddress Data Collector.
 *
 * @param {string} label - The label of the email address (WORK_EMAIL, HOME_EMAIL...).
 * @param {string} address - The email address.
 */
var EmailAddressDC = function (label, address) {
  DataCollector.apply(this);
  this.setProp('label', label);
  this.setProp('address', address);
};
EmailAddressDC.prototype = Object.create(DataCollector.prototype);
EmailAddressDC.prototype.constructor = EmailAddressDC;

/**
 * Init a PhoneNumber Data Collector.
 *
 * @param {string} label - The label of the phone number (WORK_PHONE, HOME_PHONE...).
 * @param {string} number - The phone number.
 */
var PhoneNumberDC = function (label, number) {
  DataCollector.apply(this);
  this.setProp('label', label);
  this.setProp('number', number);
};
PhoneNumberDC.prototype = Object.create(DataCollector.prototype);
PhoneNumberDC.prototype.constructor = PhoneNumberDC;

/**
 * ContactData Data Collector.
 *
 * @param {string} fullName - The full name of the contact.
 * @param {string} nickname - The nickname of the contact.
 * @param {string} photoURL - The URL of the profile image of the contact.
 */
var ContactDataDC = function (fullName, nickname, photoURL) {
  DataCollector.apply(this);
  this.setProp('fullName', fullName);
  this.setProp('nickname', nickname);
  this.setProp('photoURL', photoURL);
};
ContactDataDC.prototype = Object.create(DataCollector.prototype);
ContactDataDC.prototype.constructor = ContactDataDC;

/**
 * Init a Log object, used to manage a collection of logEvents {time, text, priority}.
 *
 * @param {string} minimumPriority - One of 'none', 'error', 'warning', 'info': logs with
 *                        priority lower than this will not be recorded.
 * @param {string} emailMinimumPriority - One of 'none', 'error', 'warning', 'info': if at least
 *                        one log with priority greater than or equal to this is recorded an email
 *                        with all the logs will be sent to the user.
 * @class
 */
function Log (minimumPriority, emailMinimumPriority) {
  /** @type {number} */
  this.minimumPriority = this.evalPriority(minimumPriority);
  /** @type {number} */
  this.emailMinimumPriority = this.evalPriority(emailMinimumPriority);
  /** @type {Object[]} */
  this.events = [];
}

/**
 * Store a new event in the log. The default priority is the lowest one (info).
 *
 * @param {any} data - The data to be logged: best if a string, Objects get JSONized.
 * @param {string} [priority=info] - Priority of the leg event.
 * @param {boolean} [testing=false] - If this is true logging an 'error' will not cause execution to stop.
 */
Log.prototype.add = function (data, priority, testing) {
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

  // Throw an Error and interrupt the execution if the log event had 'error'
  // priority and we are not in test mode.
  if (priority === 'error' && !testing) {
    this.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
    throw new Error(text);
  }
};

/**
 * Calculate a numeric value for a textual description of a priority.
 *
 * @param {string} priority - The priority of the events.
 * @returns {number} - A number between 1 and 100 representing the priority of the event.
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

/**
 * Get the output of the log as an array of messages.
 * Format of the messages (P is the first letter of the priority):
 *   "[TIME] P: MESSAGE"
 *
 * @returns {string[]}
 */
Log.prototype.getOutput = function () {
  return this.events.map(function (e) {
    return '[' + e.time + '] ' + e.priorityDescr[0].toUpperCase() + ': ' + e.text;
  });
};

/**
 * Verify if the log contains at least an event with priority equal to or greater than
 * the specified priority.
 *
 * @param {number} minimumPriority - The numeric value representing the priority limit.
 * @returns {boolean}
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

/**
 * If the filter condition is met send all the logs collected to the specified email.
 *
 * @param {string} to - The email address of the recipient of the email.
 * @param {string} senderName - The name of the sender.
 */
Log.prototype.sendEmail = function (to, senderName) {
  if (this.containsMinimumPriority(this.emailMinimumPriority)) {
    this.add('Sending logs via email.', 'info');
    MailApp.sendEmail({
      to: to,
      subject: 'Logs for Google Contacts Events Notifications',
      body: this.getOutput().join('\n'),
      name: senderName
    });
    this.add('Email sent.', 'info');
  }
};

/**
 * An object representing a simplified semantic version number.
 * It must be composed of:
 *  - three dot-separated positive integers (major version,
 *    minor version and patch number);
 *  - optionally a pre-release identifier, prefixed by a hyphen;
 *  - optionally a metadata identifier, prefixed by a plus sign;
 * This differs from the official SemVer style because the pre-release
 * string is compared as a whole in version comparison instead of
 * being spliced into chunks.
 *
 * @param {string} versionNumber - The version number to build the object with.
 *
 * @class
 */
function SimplifiedSemanticVersion (versionNumber) {
  var matches, self;

  self = this;

  /** @type {number[]} */
  self.numbers = [0, 0, 0];
  /** @type {string} */
  self.preRelease = '';
  /** @type {string} */
  self.metadata = '';

  // Extract the pieces of information from the given string.
  matches = versionNumber.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+?))?(?:\+(.+))?$/);
  if (matches) {
    self.numbers[0] = parseInt(matches[1]);
    self.numbers[1] = parseInt(matches[2]);
    self.numbers[2] = parseInt(matches[3]);
    self.preRelease = typeof matches[4] === 'undefined' ? '' : matches[4];
    self.metadata = typeof matches[5] === 'undefined' ? '' : matches[5];
  } else {
    throw new Error('The version number "' + versionNumber + '" is not valid!');
  }
}

/**
 * Build the version number string from the data.
 *
 * @returns {string} - The version number of this version.
 */
SimplifiedSemanticVersion.prototype.toString = function () {
  return this.numbers.join('.') +
    (this.preRelease !== '' ? '-' + this.preRelease : '') +
    (this.metadata !== '' ? '+' + this.metadata : '');
};

/**
 * Compare a semantic version number with another one.
 *
 * Order of comparison: major number, minor number, patch number,
 * preRelease string (ASCII comparison). Metadata do not influence
 * comparisons.
 *
 * @param {SimplifiedSemanticVersion} comparedVersion - The version to compare.
 * @returns {number} - 1, 0 , -1 if this version number is greater than,
 *                     equal to or smaller than the one passed as the parameter.
 */
SimplifiedSemanticVersion.prototype.compare = function (comparedVersion) {
  var i;
  for (i = 0; i < 3; i++) {
    if (this.numbers[i] !== comparedVersion.numbers[i]) {
      return (this.numbers[i] < comparedVersion.numbers[i] ? -1 : 1);
    }
  }
  if (this.preRelease !== comparedVersion.preRelease) {
    // Between two versions with the same numbers, one in pre-release and the
    // other not, the one in pre-release must be considered smaller.
    if (this.preRelease === '') {
      return 1;
    } else if (comparedVersion.preRelease === '') {
      return -1;
    }
    return (this.preRelease < comparedVersion.preRelease ? -1 : 1);
  }
  return 0;
};

// EXTENDED NATIVE PROTOTYPES

if (typeof Array.prototype.extend === 'undefined') {
  /**
   * Merge an array at the end of an existing array.
   * Example:
   *  a = [1, 2, 3], b = [4, 5, 6];
   *  a.extend(b);
   *  a -> [1, 2, 3, 4, 5, 6]
   *
   * @param {any[]} array - The array used to extend.
   * @returns {any[]} - Returns this for subsequent calls.
   */
  Array.prototype.extend = function (array) { // eslint-disable-line no-extend-native
    var i;

    for (i = 0; i < array.length; ++i) {
      this.push(array[i]);
    }
    return this;
  };
}

if (typeof String.prototype.format === 'undefined') {
  /**
   * Format a string, replace {1}, {2}, etc with their corresponding trailing args.
   * Examples:
   * 'This is a {0}'.format('test') -> 'This is a test.'
   * 'This {0} a {1}'.format('is') -> 'This is a {1}.'
   * @param {...string} arguments
   * @returns {string}
   */
  String.prototype.format = function () { // eslint-disable-line no-extend-native
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

if (typeof String.prototype.replaceAll === 'undefined') {
  /**
   * Replace all occurrences of a substring (not a regex).
   *
   * @param {string} substr - The substring to be replaced.
   * @param {string} repl - The replacement for the substring.
   * @returns {string} - The string with the substrings replaced.
   */
  String.prototype.replaceAll = function (substr, repl) { // eslint-disable-line no-extend-native
    return this.split(substr).join(repl);
  };
}

// GLOBAL VARIABLES

 /**
  * The version of the script.
 */
var version = new SimplifiedSemanticVersion(settings.developer.version);

// These URLs are used to access the files in the repository or specific pages on GitHub.
var baseRawFilesURL = 'https://raw.githubusercontent.com/' + settings.developer.repoName + '/' + settings.developer.gitHubBranch + '/';
var baseGitHubProjectURL = 'https://github.com/' + settings.developer.repoName + '/';
var baseGitHubApiURL = 'https://api.github.com/repos/' + settings.developer.repoName + '/';

// Convert user-configured hash to an array
var eventTypes = Object.keys(settings.notifications.eventTypes)
  .filter(function (x) { return settings.notifications.eventTypes[x]; });

// Build the indentation from the setting.
var indent = Array(settings.notifications.indentSize + 1).join(' ');

var inlineImages;

var log = new Log(settings.debug.log.filterLevel, settings.debug.log.sendTrigger);

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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Κινητό',
    'Work phone': 'Τηλέφωνο εργασίας',
    'Home phone': 'Τηλέφωνο οικίας',
    'Main phone': 'Κύριο τηλέφωνο',
    // TODO: 'Other phone': '',
    'Home fax': 'Φαξ οικίας',
    'Work fax': 'Φαξ εργασίας',
    'Home email': 'Email οικίας',
    'Work email': 'Email εργασίας',
    // TODO: 'Other email': '',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Celular',
    'Work phone': 'Teléfono del trabajo',
    'Home phone': 'Teléfono del hogar',
    'Main phone': 'Teléfono principal',
    // TODO: 'Other phone': '',
    // TODO: 'Home fax': '',
    // TODO: 'Work fax': '',
    // TODO: 'Home email': '',
    // TODO: 'Work email': '',
    // TODO: 'Other email': '',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Cellulare',
    'Work phone': 'Telefono di lavoro',
    'Home phone': 'Telefono di casa',
    'Main phone': 'Telefono principale',
    // TODO: 'Other phone': '',
    'Home fax': 'Fax di casa',
    'Work fax': 'Fax di lavoro',
    'Home email': 'Email di casa',
    'Work email': 'Email di lavoro',
    // TODO: 'Other email': '',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telp. Selular',
    'Work phone': 'Telp. Kantor',
    'Home phone': 'Telp. Rumah',
    'Main phone': 'Telp. Utama',
    // TODO: 'Other phone': '',
    // TODO: 'Home fax': '',
    // TODO: 'Work fax': '',
    // TODO: 'Home email': '',
    // TODO: 'Work email': '',
    // TODO: 'Other email': '',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobiltelefon',
    'Work phone': 'Geschäftlich',
    'Home phone': 'Privat',
    'Main phone': 'Hauptnummer',
    // TODO: 'Other phone': '',
    // TODO: 'Home fax': '',
    // TODO: 'Work fax': '',
    // TODO: 'Home email': '',
    // TODO: 'Work email': '',
    // TODO: 'Other email': '',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Telefon komórkowy',
    'Work phone': 'Telefon (praca)',
    'Home phone': 'Telefon (domowy)',
    'Main phone': 'Telefon (główny)',
    // TODO: 'Other phone': '',
    // TODO: 'Home fax': '',
    // TODO: 'Work fax': '',
    // TODO: 'Home email': '',
    // TODO: 'Work email': '',
    // TODO: 'Other email': '',
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
    'dd-MM-yyyy': 'dd-MM-yyyy',
    'Mobile phone': 'Mobile',
    'Work phone': 'Travail',
    'Home phone': 'Maison',
    'Main phone': 'Principal',
    // TODO: 'Other phone': '',
    // TODO: 'Home fax': '',
    // TODO: 'Work fax': '',
    // TODO: 'Home email': '',
    // TODO: 'Work email': '',
    // TODO: 'Other email': '',
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

/**
 * Get the translation of a string.
 * If the language or the chosen string is invalid return the string itself.
 *
 * @param {string} string
 * @returns {string}
 */
function _ (string) {
  return i18n[settings.user.lang][string] || string;
}

/**
 * Replace a Field.Label object with its "beautified" text representation.
 *
 * @param {any} label
 * @returns {string}
 */
function beautifyLabel (label) {
  switch (String(label)) {
    case 'MOBILE_PHONE':
    case 'WORK_PHONE':
    case 'HOME_PHONE':
    case 'MAIN_PHONE':
    case 'HOME_FAX':
    case 'WORK_FAX':
    case 'HOME_EMAIL':
    case 'WORK_EMAIL':
    case 'OTHER_EMAIL': // fake label for output
    case 'OTHER_PHONE': // fake label for output
      return _(label[0] + label.slice(1).replaceAll('_', ' ').toLowerCase());
    default:
      return String(label);
  }
}

/**
 * Replace HTML special characters in a string with their HTML-escaped equivalent.
 *
 * @param {string} str - The string to escape.
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
 * If there is any problem retrieving the latest version number false is returned.
 *
 * @returns {boolean} - True if the script version is lower than the latest released
 *                      one, false otherwise.
 */
function isRunningOutdatedVersion () {
  var response, latestVersion;

  // Retrieve the last version info.
  try {
    response = UrlFetchApp.fetch(baseGitHubApiURL + 'releases/latest');
    if (response.getResponseCode() !== 200) {
      throw new Error('');
    }
  } catch (err) {
    log.add('Unable to get the latest version number' + (response ? ': the requested URL returned a ' + response.getResponseCode() + ' response.' : ''), 'warning');
    return false;
  }

  // Parse the info for the version number.
  try {
    response = JSON.parse(response);
    if (typeof response !== 'object') {
      throw new Error('');
    }
  } catch (err) {
    log.add('Unable to get the latest version number: failed to parse the API response as JSON object', 'warning');
    return false;
  }
  latestVersion = response.tag_name;
  if (typeof latestVersion !== 'string' || latestVersion.length === 0) {
    log.add('Unable to get the latest version number: there was no valid tag_name string in the API response.', 'warning');
    return false;
  }
  if (latestVersion.substring(0, 1) === 'v') {
    latestVersion = latestVersion.substring(1);
  }

  // Compare the versions.
  try {
    return (version).compare(new SimplifiedSemanticVersion(latestVersion)) === -1;
  } catch (err) {
    log.add(err.message, 'warning');
    return false;
  }
}

/**
 * Get a a CalendarApp.Month's numerical representation.
 *
 * @param {Object} month
 * @returns {number} - 0-11 for each month, -1 for wrong values.
 */
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

/**
 * Return a list of strings with duplicate strings removed.
 *
 * @param {string[]} x - The list containing the duplicates.
 * @returns {string[]} - The list without duplicates.
 */
function uniqueStrings (x) {
  var seen = {};
  return x.filter(function (str) {
    return seen.hasOwnProperty(str) ? false : (seen[str] = true);
  });
}

// MAIN FUNCTIONS

/**
 * Returns an array with the events happening in the calendar with
 * ID 'calendarId' on date 'eventDate'.
 *
 * @param {Date} eventDate - The date the events must fall on.
 * @param {string} calendarId - The id of the calendar from which events are collected.
 * @returns {Object[]} - A list of rawEvent Objects.
 */
function getEventsOnDate (eventDate, calendarId) {
  var eventCalendar, startDate, endDate, events;

  // Verify the existence of the events calendar.
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

/**
 * Send an email notification to the user containing a list of the events
 * of his/her contacts scheduled for the next days.
 *
 * @param {?Date} forceDate - If this value is not null it's used as 'now'.
 */
function main (forceDate) {
  log.add('main() running.', 'info');

  var emailData = generateEmailNotification(forceDate);

  // If generateEmailNotification returned mail content send it.
  if (emailData !== null) {
    log.add('Sending email...', 'info');

    MailApp.sendEmail({
      to: settings.user.notificationEmail,
      subject: emailData.subject,
      body: emailData.body,
      htmlBody: emailData.htmlBody,
      inlineImages: emailData.inlineImages,
      name: settings.user.emailSenderName
    });

    log.add('Email sent.', 'info');
  }

  // Send the log if the debug options say so.
  log.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
}

/**
 * Generate the content of an email to the user containing a list of the events
 * of his/her contacts scheduled on agiven date.
 *
 * @param {?Date} forceDate - If this value is not null it's used as 'now'.
 * @returns {Object.<string,any>} - The content of the email.
 */
function generateEmailNotification (forceDate) {
  var now, events, contactList, calendarTimeZone, subjectPrefix, subjectBuilder, subject,
    bodyPrefix, bodySuffixes, bodyBuilder, body, htmlBody, htmlBodyBuilder;

  log.add('generateEmailNotification() running.', 'info');
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
    return null;
  }
  log.add('Found ' + events.length + ' events.', 'info');

  contactList = [];

  /*
   * Build a list of contacts (with complete information) from the event list.
   * Note: multiple events can refer to the same contact.
   */
  events.forEach(function (rawEvent) {
    var eventData, i;

    if (!rawEvent.gadget || !rawEvent.gadget.preferences) {
      log.add(rawEvent, 'info');
      log.add('The structure of this event cannot be parsed.', 'error');
    }
    eventData = rawEvent.gadget.preferences;

    // Look if the contact of this event is already in the contact list.
    for (i = 0; i < contactList.length; i++) {
      if (
        (
          eventData['goo.contactsContactId'] !== null &&
          eventData['goo.contactsContactId'] === contactList[i].contactId
        ) ||
        (
          eventData['goo.contactsProfileId'] !== null &&
          eventData['goo.contactsProfileId'] === contactList[i]
        )
      ) {
        // FOUND!
        // Integrate this event information into the contact.
        contactList[i].getInfoFromRawEvent(rawEvent);
        break;
      }
    }
    if (i === contactList.length) {
      // NOT FOUND!
      // Add a new contact to the contact list and store all the info in that contact.
      contactList.push(new Contact());
      contactList[i].getInfoFromRawEvent(rawEvent);
    }
  });

  if (contactList.length === 0) {
    log.add('Something went wrong: from ' + events.length + ' events no Contact was built...', 'error');
  }
  log.add('Built ' + contactList.length + ' contacts.', 'info');

  // Give a default profile image to the contacts without one.
  contactList.forEach(function (contact) {
    contact.data.merge(new ContactDataDC(
      null,                                             // Full name.
      null,                                             // Nickname.
      baseRawFilesURL + 'images/default_profile.jpg')   // Profile photo URL.
    );
  });

  // Start building the email notification text.
  subjectPrefix = _('Events') + ': ';
  subjectBuilder = [];
  bodyPrefix = _('Hey! Don\'t forget these events') + ':';
  bodySuffixes = [
    _('Google Contacts Events Notifier') + ' (' + _('version') + ' ' + version.toString() + ')',
    _('It looks like you are using an outdated version of this script') + '.',
    _('You can find the latest one here')
  ];
  inlineImages = {};

  // The email is built both with plain text and HTML text.
  bodyBuilder = [];
  htmlBodyBuilder = [];

  calendarTimeZone = Calendar.Calendars.get(settings.user.calendarId).getTimeZone();
  settings.notifications.anticipateDays
    .forEach(function (daysInterval) {
      var date, formattedDate;

      date = new Date(now.getTime() + daysInterval * 24 * 60 * 60 * 1000);
      formattedDate = Utilities.formatDate(date, calendarTimeZone, _('dd-MM-yyyy'));

      eventTypes.forEach(
        function (eventType) {
          var eventTypeNamePlural, plaintextLines, htmlLines, whenIsIt;

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
          log.add('Checking ' + eventTypeNamePlural + ' on ' + formattedDate, 'info');

          subjectBuilder.extend(contactList.map(function (contact) { return contact.data.getProp('fullName'); }));
          plaintextLines = contactList
            .map(function (contact) { return contact.getLines(eventType, date, 'plain'); })
            .filter(function (lines) { return lines.length > 0; });
          htmlLines = contactList
            .map(function (contact) { return contact.getLines(eventType, date, 'html'); })
            .filter(function (lines) { return lines.length > 0; });
          if (plaintextLines.length === 0 || htmlLines.length === 0) {
            log.add('No events found on this date.', 'info');
            return;
          }
          log.add('Found ' + plaintextLines.length + ' ' + eventTypeNamePlural, 'info');
          // Build the headers of 'eventType' event grouping by date.
          bodyBuilder.push('\n * ');
          htmlBodyBuilder.push('<dt style="margin-left:0.8em;font-style:italic">');
          whenIsIt = eventTypeNamePlural.charAt(0).toUpperCase() + eventTypeNamePlural.slice(1);
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
          bodyBuilder.push(whenIsIt, ':\n');
          plaintextLines.forEach(function (line) { bodyBuilder.extend(line); });
          htmlBodyBuilder.push(whenIsIt, '</dt><dd style="margin-left:0.4em;padding-left:0"><ul style="list-style:none;margin-left:0;padding-left:0;">');
          htmlLines.forEach(function (line) { htmlBodyBuilder.extend(line); });
          htmlBodyBuilder.push('</dd></ul>');
        });
    });

  if (bodyBuilder.length === 0) {
    // If there is no email to send
    return null;
  } else {
    // If there is an email to send build the content...
    log.add('Building the email notification.', 'info');
    subject = subjectPrefix + uniqueStrings(subjectBuilder).join(' - ');
    body = [bodyPrefix, '\n']
      .concat(bodyBuilder)
      .concat(['\n\n ', bodySuffixes[0], '\n '])
      .concat('\n', isRunningOutdatedVersion() ? [bodySuffixes[1], ' ', bodySuffixes[2], ':\n', baseGitHubProjectURL + 'releases/latest', '\n '] : [])
      .join('');
    htmlBody = ['<h3>', htmlEscape(bodyPrefix), '</h3><dl>']
      .concat(htmlBodyBuilder)
      .concat(['</dl><hr/><p style="text-align:center;font-size:smaller"><a href="' + baseGitHubProjectURL + '">', htmlEscape(bodySuffixes[0]), '</a>'])
      .concat(isRunningOutdatedVersion() ? ['<br/><br/><b>', htmlEscape(bodySuffixes[1]), ' <a href="', baseGitHubProjectURL, 'releases/latest', '">', htmlEscape(bodySuffixes[2]), '</a>.</b></p>'] : ['</p>'])
      .join('');

    // ...and return it.
    return {
      'subject': subject,
      'body': body,
      'htmlBody': htmlBody,
      'inlineImages': inlineImages
    };
  }
}

/**
 * Execute the main() function without forcing any date as "now".
 */
function normal () { // eslint-disable-line no-unused-vars
  log.add('normal() running.', 'info');
  main(null);
}

/**
 * Execute the main() function forcing a given date (settings.debug.testDate) as "now".
 */
function test () { // eslint-disable-line no-unused-vars
  log.add('test() running.', 'info');
  main(settings.debug.testDate);
}

// NOTIFICATION SERVICE FUNCTIONS

/**
 * Start the notification service.
 */
function notifStart () { // eslint-disable-line no-unused-vars
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

/**
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

/**
 * Check if notification service is running.
 */
function notifStatus () { // eslint-disable-line no-unused-vars
  var toLog = 'Notifications are ';
  if (ScriptApp.getProjectTriggers().length < 1) {
    toLog += 'not ';
  }
  toLog += 'running.';
  log.add(toLog);
  log.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
}
