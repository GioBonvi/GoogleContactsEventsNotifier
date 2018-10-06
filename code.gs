/* global Logger Plus ScriptApp ContactsApp Utilities Calendar CalendarApp UrlFetchApp MailApp Session */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
/* eslint comma-dangle: ["error", "only-multiline"] */

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
     * SOURCE OF THE EVENTS
     *
     * In your birthday calendar settings you have chosen whether to track the birthdays
     * of just your Google Contacts or those of your Google Contacts and of your Google
     * Plus contacts as well.
     * You can check which setting you chose by opening https://calendar.google.com, clicking
     * on the arrow next to the the contacts events calendar (which should have a name like
     * 'Birthdays and events') in the menu on the left and opening 'Calendar settings'.
     *
     * You can set this variable to:
     *  'DEFAULT'              This will make the script follow your Google Calendar setting.
     *  'CONTACTS_ONLY'        This will force the script to track just the birthdays of your
     *                         Google Contacts, ignoring your Google Calendar setting.
     *  'CONTACTS_AND_GPLUS'   This will force the script to track the birthdays of both
     *                         your Google Contacts and Google Plus contacts, ignoring your
     *                         Google Calendar setting.
     *   Anything else will be interpreted as a a hard-coded Google Calendar ID from which
     *   to extract the events.
     */
    eventSource: 'DEFAULT',
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
     * Available languages are: en, el, es, it, de, id, pl, fr, nl, pt.
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
  debug: {
    log: {
      /*
       * LOGGING FILTER LEVEL
       *
       * This settings lets you filter which type of events will get logged:
       *  - 'INFO' will log all types of events event (messages, warnings and errors);
       *  - 'WARNING' will log warnings and errors only (discarding messages);
       *  - 'ERROR' will log errors only (discarding messages and warnings);
       *  - 'FATAL_ERROR' will log fatal errors only (discarding messages, warnings and non-fatal errors);
       *  - 'MAX' will effectively disable the logging (nothing will be logged);
       */
      filterLevel: 'INFO',
      /*
       * Set this variable to: 'INFO', 'WARNING', 'ERROR', 'FATAL_ERROR' or 'MAX'. You will be sent an
       * email containing the full execution log of the script if at least one event of priority
       * equal or greater to sendTrigger has been logged. 'MAX' means that such emails will
       * never be sent.
       * Note: filterLevel has precedence over this setting! For example if you set filterLevel
       * to 'MAX' and sendTrigger to 'WARNING' you will never receive any email as nothing will
       * be logged due to the filterLevel setting.
       */
      sendTrigger: 'ERROR'
    },
    /*
     * TEST DATE
     *
     * When using the test() function this date will be used as "now". The date must be in the
     * yyyy/MM/dd HH:mm:ss format.
     * Choose a date you know should trigger an event notification.
     */
    testDate: new Date('2017/08/01 06:00:00')
  },
  developer: {
    /* NB: Users shouldn't need to (or want to) touch these settings. They are here for the
     *     convenience of developers/maintainers only.
     */
    version: '4.1.0',
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
 * Initialize a LocalCache object.
 *
 * A LocalCache object is used to store external resources which are used multiple
 * times to optimize the number of `UrlFetchApp.fetch()` calls.
 *
 * @class
 */
function LocalCache () {
  this.cache = {};
}

/**
 * Fetch an URL, optionally making more than one try.
 *
 * @param {!string} url - The URL which has to be fetched.
 * @param {?number} [tries=1] - Number of times to try the fetch operation before failing.
 * @returns {?Object} - The fetch response or null if the fetch failed.
 */
LocalCache.prototype.fetch = function (url, tries) {
  var response, i;

  tries = tries || 1;

  response = null;
  // Try fetching the data.
  for (i = 0; i < tries; i++) {
    try {
      response = UrlFetchApp.fetch(url);
      if (response.getResponseCode() !== 200) {
        throw new Error('');
      }
      // Break the loop if the fetch was successful.
      break;
    } catch (error) {
      response = null;
      Utilities.sleep(1000);
    }
  }
  // Store the result in the cache and return it.
  this.cache[url] = response;
  return this.cache[url];
};

/**
 * Determine whether an url has already been cached.
 *
 * @param {!string} url - The URL to check.
 * @returns {boolean} - True if the cache contains an object for the URL, false otherwise.
 */
LocalCache.prototype.isCached = function (url) {
  return !!this.cache[url];
};

/**
 * Retrieve an object from the cache.
 *
 * The object is loaded from the cache if present, otherwise it is fetched.
 *
 * @param {!string} url - The URL to retrieve.
 * @param {?number} tries - Number of times to try the fetch operation before failing (passed to `this.fetch()`).
 * @returns {Object} - The response object.
 */
LocalCache.prototype.retrieve = function (url, tries) {
  if (this.isCached(url)) {
    return this.cache[url];
  } else {
    return this.fetch(url, tries);
  }
};

/**
 * Initialize an empty contact.
 *
 * A MergedContact object holds the data about a contact collected from multiple sources.
 *
 * @class
 */
function MergedContact () {
  /** @type {?string} */
  this.contactId = null;
  /** @type {?string} */
  this.gPlusId = null;
  // Consider all the event types excluded by settings.notifications.eventTypes
  // as blacklisted for all contacts.
  /** @type {string[]} */
  this.blacklist = Object.keys(settings.notifications.eventTypes)
    .filter(function (label) { return settings.notifications.eventTypes[label] === false; })
    .map(eventLabelToLowerCase);
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
 * Extract all the available data from the raw event object and store them in the `MergedContact`.
 *
 * @param {Object} rawEvent - The object containing all the data about the event, obtained
 *                            from the Google Calendar API.
 */
MergedContact.prototype.getInfoFromRawEvent = function (rawEvent) {
  var self, eventData, eventDate, eventMonth, eventDay, eventLabel;

  log.add('Extracting info from raw event object...', Priority.INFO);

  // We already know .gadget.preferences exists, we checked before getting contactId, before
  // calling this method - to know whether to "merge to existing" or "create new" contact.
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
  eventMonth = null;
  eventDay = null;
  if (eventDate) {
    eventLabel = eventData['goo.contactsEventType'];
    if (eventLabel === 'SELF') {
      // Your own birthday is marked as 'SELF'.
      eventLabel = 'BIRTHDAY';
    } else if (eventLabel === 'CUSTOM') {
      // Custom events have an additional field containing the custom name of the event.
      eventLabel += ':' + (eventData['goo.contactsCustomEventType'] || '');
    }
    eventMonth = (eventDate[2] !== '00' ? parseInt(eventDate[2], 10) : null);
    eventDay = (eventDate[3] !== '00' ? parseInt(eventDate[3], 10) : null);
    this.addToField('events', new EventDC(
      eventLabel,                                                   // Label.
      null,                                                         // Year.
      eventMonth,                                                   // Month.
      eventDay                                                      // Day.
    ));
  }
  // Collect info from the contactId if not already collected and if contactsContactId exists.
  if (this.contactId === null && eventData['goo.contactsContactId']) {
    this.getInfoFromContact(eventData['goo.contactsContactId'], eventMonth, eventDay);
  }
  // Collect info from the gPlusId if not already collected and if contactsProfileId exists.
  if (this.gPlusId === null && eventData['goo.contactsProfileId']) {
    this.getInfoFromGPlus(eventData['goo.contactsProfileId']);
  }
  // delete any events marked as blacklisted (but already added e.g. from raw event data)
  if (this.blacklist) {
    self = this;
    self.blacklist.forEach(function (label) {
      self.deleteFromField('events', label, false);
    });
  }
};

/**
 * Update the `MergedContact` with info collected from a Google Contact.
 *
 * Some raw events will contain a Google Contact ID which gives access
 * to a bunch of new data about the contact.
 *
 * This data is used to update the information collected until now.
 *
 * @param {!string} contactId  - The id from which to collect the data.
 * @param {?string} eventMonth - The month to match events.
 * @param {?string} eventDay   - The day to match events.
 */
MergedContact.prototype.getInfoFromContact = function (contactId, eventMonth, eventDay) {
  var self, googleContact, blacklist;

  self = this;
  log.add('Extracting info from Google Contact...', Priority.INFO);

  // Contact ID.
  // Using try-catch here because failure to fetch data for the ID is as much of a
  // problem as an invalid ID.
  try {
    googleContact = ContactsApp.getContactById('http://www.google.com/m8/feeds/contacts/' + encodeURIComponent(settings.user.googleEmail) + '/base/' + encodeURIComponent(contactId));
    if (googleContact === null) {
      throw new Error('');
    }
  } catch (err) {
    log.add('Invalid Google Contact ID or error retrieving data for ID: ' + contactId, Priority.INFO);
    return;
  }
  self.contactId = contactId;

  // Contact identification data.
  self.data.merge(new ContactDataDC(
    googleContact.getFullName(),  // Name.
    googleContact.getNickname(),  // Nickname.
    null                          // Profile image URL.
  ));

  // Events blacklist.
  blacklist = googleContact.getCustomFields('notificationBlacklist');
  if (blacklist && blacklist[0]) {
    self.blacklist = uniqueStrings(self.blacklist.concat(blacklist[0].getValue().replace(/,+/g, ',').replace(/(^,|,$)/g, '').split(',').map(function (x) {
      x = x.toLocaleLowerCase();
      return ((x === 'birthday' || x === 'anniversary') ? x : ('CUSTOM:' + x));
    })));
  }

  // Events.
  googleContact.getDates().forEach(function (dateField) {
    var thisEventLabel, thisEventMonth, thisEventDay, lowerCaseEventLabel, dateMatches, blacklistMatches;

    thisEventLabel = dateField.getLabel();
    if (typeof thisEventLabel === 'string') {
      thisEventLabel = 'CUSTOM:' + thisEventLabel;
    } else {
      thisEventLabel = String(thisEventLabel);
    }
    lowerCaseEventLabel = eventLabelToLowerCase(thisEventLabel);
    thisEventMonth = monthToInt(dateField.getMonth()) + 1;
    thisEventDay = dateField.getDay();
    dateMatches = ((!eventDay && !eventMonth) || (thisEventMonth === eventMonth && thisEventDay === eventDay));
    blacklistMatches = self.blacklist && self.blacklist.length && isIn(lowerCaseEventLabel, self.blacklist);
    if (dateMatches && !blacklistMatches) {
      self.addToField('events', new EventDC(
        thisEventLabel,
        dateField.getYear(),
        thisEventMonth,
        thisEventDay
      ));
    }
  });

  // Email addresses.
  googleContact.getEmails().forEach(function (emailField, i) {
    self.addToField('emails', new EmailAddressDC(
      String(emailField.getLabel()),
      emailField.getAddress()
    ));
  });

  // Phone numbers.
  googleContact.getPhones().forEach(function (phoneField, i) {
    self.addToField('phones', new PhoneNumberDC(
      String(phoneField.getLabel()),
      phoneField.getPhoneNumber()
    ));
  });
};

/**
 * Update the `MergedContact` with info collected from a Google+ Profile.
 *
 * Some raw events will contain a Google Plus Profile ID which
 * gives access to a bunch of new data about the contact.
 *
 * This data is used to update the information collected until now.
 *
 * @param {string} gPlusProfileId - The id from which to collect the data.
 */
MergedContact.prototype.getInfoFromGPlus = function (gPlusProfileId) {
  var gPlusProfile, birthdayDate;

  if (!settings.user.accessGooglePlus) {
    log.add('Not extracting info from Google Plus Profile, as per configuration.', Priority.INFO);
    return;
  }
  log.add('Extracting info from Google Plus Profile...', Priority.INFO);

  // Profile ID.
  // Using try-catch here because failure to fetch data for the ID is as much of a
  // problem as an invalid ID.
  try {
    gPlusProfile = Plus.People.get(gPlusProfileId);
    if (gPlusProfile === null) {
      throw new Error('');
    }
  } catch (err) {
    log.add('Invalid GPlus Profile ID or error retrieving data for ID: ' + gPlusProfileId, Priority.INFO);
    return;
  }
  this.gPlusId = gPlusProfileId;

  // Profile identification data.
  this.data.merge(new ContactDataDC(
    gPlusProfile.name.formatted,  // Name.
    gPlusProfile.nickname,        // Nickname.
    gPlusProfile.image.url        // Profile image URL.
  ));

  // Events.
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
 *
 * For example take `EventDC e` and `EventDC[] arr`; This method checks
 * all the elements of `arr`: if it finds one that is compatible with `e`
 * it merges `e` into that element, otherwise, if no element in the array
 * is compatible or if the array is empty, it just adds `e` at the end of
 * the array.
 *
 * @param {!string} field - The name of the field in which to insert the object.
 * @param {DataCollector} incData - The object to insert.
 */
MergedContact.prototype.addToField = function (field, incData) {
  var merged, i, data;

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
  // Use 'for' instead of 'forEach', so we can short-circuit with 'break'
  for (i = 0; i < this[field].length; i++) {
    data = this[field][i];
    if (!data.isConflicting(incData)) {
      data.merge(incData);
      merged = true;
      break;
    }
  }
  // If incData could not be merged simply append it to the field.
  if (!merged) {
    this[field].push(incData);
  }
};

/**
 * This method is used to delete a DataCollector from an array of
 * DataCollectors based on label.
 *
 * @param {!string} field - The name of the field from which to delete the object.
 * @param {!string} label - The label to match to signify deletion.
 * @param {?boolean} caseSensitive - Whether to match labels case-sensitively or not.
 */
MergedContact.prototype.deleteFromField = function (field, label, caseSensitive) {
  var data, eachLabel, fieldIter;

  if (!caseSensitive) {
    label = eventLabelToLowerCase(label);
  }
  // Iterate by reverse index to allow safe splicing from within the loop
  fieldIter = this[field].length;
  while (fieldIter--) {
    data = this[field][fieldIter];
    eachLabel = data.getProp('label');
    if (!caseSensitive) {
      eachLabel = eventLabelToLowerCase(eachLabel);
    }
    // Delete those events whose label exactly matches the one given or,
    // if the given label is 'Custom', all the custom events.
    if (label === eachLabel || (label === 'custom' && eachLabel.indexOf('CUSTOM:') === 0)) {
      this[field].splice(fieldIter, 1);
      break;
    }
  }
};

/**
 * Generate a list of text lines of the given format, each describing an
 * event of the contact of the type specified on the date specified.
 *
 * @param {!string} type - The type of the event.
 * @param {!Date} date - The date of the event.
 * @param {!NotificationType} format - The format of the text line.
 * @returns {string[]} - A list of the plain text descriptions of the events.
 */
MergedContact.prototype.getLines = function (type, date, format) {
  var self;

  self = this;
  return self.events.filter(function (event) {
    var typeMatch;
    switch (event.getProp('label')) {
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
    var line, eventLabel, imgCount;

    line = [];
    // Start line.
    switch (format) {
      case NotificationType.PLAIN_TEXT:
        line.push(indent);
        break;
      case NotificationType.HTML:
        line.push('<li>');
    }
    // Profile photo.
    switch (format) {
      case NotificationType.HTML:
        imgCount = Object.keys(inlineImages).length;
        try {
          // Get the default profile image from the cache.
          inlineImages['contact-img-' + imgCount] = cache.retrieve(self.data.getProp('photoURL')).getBlob().setName('contact-img-' + imgCount);
          line.push('<img src="cid:contact-img-' + imgCount + '" style="height:1.4em;margin-right:0.4em" />');
        } catch (err) {
          log.add('Unable to get the profile picture with URL ' + self.data.getProp('photoURL'), Priority.WARNING);
        }
    }
    // Custom label
    if (type === 'CUSTOM') {
      eventLabel = event.getProp('label') || 'OTHER';
      switch (format) {
        case NotificationType.PLAIN_TEXT:
          line.push('<', beautifyLabel(eventLabel), '> ');
          break;
        case NotificationType.HTML:
          line.push(htmlEscape('<' + beautifyLabel(eventLabel) + '> '));
      }
    }
    // Full name.
    switch (format) {
      case NotificationType.PLAIN_TEXT:
        line.push(self.data.getProp('fullName'));
        break;
      case NotificationType.HTML:
        line.push(htmlEscape(self.data.getProp('fullName')));
    }
    // Nickname.
    if (!self.data.isPropEmpty('nickname')) {
      switch (format) {
        case NotificationType.PLAIN_TEXT:
          line.push(' "', self.data.getProp('nickname'), '"');
          break;
        case NotificationType.HTML:
          line.push(htmlEscape(' "' + self.data.getProp('nickname') + '"'));
      }
    }
    // Age/years passed.
    if (!event.isPropEmpty('year')) {
      if (type === 'BIRTHDAY') {
        switch (format) {
          case NotificationType.PLAIN_TEXT:
            line.push(' - ', _('Age'), ': ');
            break;
          case NotificationType.HTML:
            line.push(' - ', htmlEscape(_('Age')), ': ');
        }
      } else {
        switch (format) {
          case NotificationType.PLAIN_TEXT:
            line.push(' - ', _('Years'), ': ');
            break;
          case NotificationType.HTML:
            line.push(' - ', htmlEscape(_('Years')), ': ');
        }
      }
      line.push(Math.round(date.getYear() - event.getProp('year')));
    }
    // Email addresses and phone numbers.
    var collected;

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
    self.emails.forEach(function (email, i) {
      var label, emailAddr;

      if (settings.notifications.maxEmailsCount < 0 || i < settings.notifications.maxEmailsCount) {
        label = email.getProp('label');
        emailAddr = email.getProp('address');
        if (!isIn(collected[label], [undefined, null])) {
          // Store the value if the label group is already defined.
          collected[label].push(emailAddr);
        } else if (!settings.notifications.compactGrouping && label) {
          // Define a new label groups different from the main ones only if compactGrouping is set to false.
          // Note: Google's OTHER label actually is an empty string.
          collected[label] = [emailAddr];
        } else {
          // Store any other label in the OTHER_EMAIL label group.
          collected['OTHER_EMAIL'].push(emailAddr);
        }
      }
    });
    // Collect and group the phone numbers.
    self.phones.forEach(function (phone, i) {
      var label, phoneNum;

      if (settings.notifications.maxPhonesCount < 0 || i < settings.notifications.maxPhonesCount) {
        label = phone.getProp('label');
        phoneNum = phone.getProp('number');
        if (!isIn(collected[label], [undefined, null])) {
          // Store the value if the label group is already defined.
          collected[label].push(phoneNum);
        } else if (!settings.notifications.compactGrouping && label) {
          // Define a new label groups different from the main ones only if compactGrouping is set to false.
          // Note: Google's OTHER label actually is an empty string.
          collected[label] = [phoneNum];
        } else {
          // Store any other label in the OTHER_PHONE label group.
          collected['OTHER_PHONE'].push(phoneNum);
        }
      }
    });
    // If there is at least an email address/phone number to be added to the email...
    if (Object.keys(collected).reduce(function (acc, label) { return acc + collected[label].length; }, 0) >= 1) {
      // ...generate the text from the grouped emails and phone numbers.
      line.push(' (');
      line.push(
        Object.keys(collected).map(function (label) {
          var output;

          if (collected[label].length) {
            switch (format) {
              case NotificationType.PLAIN_TEXT:
                output = beautifyLabel(label);
                break;
              case NotificationType.HTML:
                output = htmlEscape(beautifyLabel(label));
            }
            return output + ': ' + collected[label].map(function (val) {
              var buffer;

              switch (format) {
                case NotificationType.PLAIN_TEXT:
                  return val;
                case NotificationType.HTML:
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
      case NotificationType.HTML:
        line.push('</li>');
    }
    return line.join('');
  });
};

/**
 * DataCollector is a structure used to collect data about any "object" (an event, an
 * email address, a phone number...) from multiple incomplete sources.
 *
 * For example the raw event could contain the day and month of the birthday, while
 * the Google Contact could hold the year as well. DataCollector can be used to accumulate
 * the data in multiple takes: each take updates the values that were left empty by the
 * previous ones until all info have been collected.
 *
 * Each DataCollector object can contain an arbitrary number of properties in the form of
 * name -> value, stored in the prop object.
 *
 * Empty properties have null value.
 *
 * DataCollector is an abstract class. Each data type should have its own implementation
 * (`EventDC`, `EmailAddressDC`, `PhoneNumberDC`).
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
 * @param {!string} key - The name of the property.
 * @returns {?string} - The value of the property.
 */
DataCollector.prototype.getProp = function (key) {
  return this.prop[key];
};

/**
 * Set a given property to a certain value.
 *
 * If the value is undefined or an empty string it's replaced by `null`.
 *
 * @param {!string} key - The name of the property.
 * @param {?string} value - The value of the property.
 */
DataCollector.prototype.setProp = function (key, value) {
  this.prop[key] = value || null;
};

/**
 * Determines whether a given property is empty or not.
 *
 * @param {!string} key - The name of the property.
 * @returns {boolean} - True if the property is empty, false otherwise.
 */
DataCollector.prototype.isPropEmpty = function (key) {
  return this.prop[key] === null;
};

/**
 * Detect whether two DataCollectors have the same constructor or not.
 *
 * * Examples:
 *         DC_1 = new EventDC(...a, b, c...)
 *         DC_2 = new EventDC(...x, y, z...)
 *         DC_3 = new EmailAddressDC(...a, b, c...)
 *         DC_4 = new EmailAddressDC(...x, y, z...)
 *
 *         DC_1.isCompatible(DC_2) -> true
 *         DC_1.isCompatible(DC_3) -> false
 *         DC_1.isCompatible(DC_4) -> false
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
 * * Examples:
 *         DC_1 = {name='test', number=3, field=null}
 *         DC_2 = {name=null, number=3, field=3}
 *         DC_3 = {name='test', number=null, field=1}
 *         DC_4 = {name='test', number=3, otherfield=null} (using different DC implementation)
 *
 *         DC_1.isConflicting(DC_2) -> false
 *         DC_1.isConflicting(DC_3) -> false
 *         DC_1.isConflicting(DC_4) -> false (not .isCompatible())
 *         DC_2.isConflicting(DC_3) -> true (conflict on field)
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
 * Merge two `DataCollector` objects, filling the empty properties of the
 * first one with the non-empty properties of the second one.
 *
 * * Examples:
 *         DC_1 = {name='test', number=3, field=null}
 *         DC_2 = {name=null, number=3, field=3}
 *         DC_2 = {name='test', number=null, field=1}
 *
 *         DC_1.merge(DC_2) -> {name='test', number=3, field=3}
 *         DC_1.isCompatible(DC_3) -> {name='test', number=3, field=1}
 *         DC_2.isCompatible(DC_3) -> INCOMPATIBLE
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
 * @param {!string} label - Label of the event (BIRTHDAY, ANNIVERSARY, ANYTHING_ELSE...)
 * @param {!number} year - Year of the event.
 * @param {!number} month - Month of the event.
 * @param {!number} day - Day of the event.
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
 * @param {!string} label - The label of the email address (WORK_EMAIL, HOME_EMAIL...).
 * @param {!string} address - The email address.
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
 * @param {!string} label - The label of the phone number (WORK_PHONE, HOME_PHONE...).
 * @param {!string} number - The phone number.
 */
var PhoneNumberDC = function (label, number) {
  DataCollector.apply(this);
  this.setProp('label', label);
  this.setProp('number', number);
};
PhoneNumberDC.prototype = Object.create(DataCollector.prototype);
PhoneNumberDC.prototype.constructor = PhoneNumberDC;

/**
 * Init a ContactData Data Collector.
 *
 * @param {!string} fullName - The full name of the contact.
 * @param {!string} nickname - The nickname of the contact.
 * @param {!string} photoURL - The URL of the profile image of the contact.
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
 * @param {?Priority} [minimumPriority=Priority.INFO] - Logs with priority lower than this will not be recorded.
 * @param {?Priority} [emailMinimumPriority=Priority.ERROR] - If at least one log with priority greater than or
                                       equal to this is recorded an email with all the logs will be sent to the user.
 * @param {?boolean} [testing=false] - If this is true logging an event with Priority.FATAL_ERROR will not
 *                                     cause execution to stop.
 * @class
 */
function Log (minimumPriority, emailMinimumPriority, testing) {
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
Log.prototype.add = function (data, priority) {
  var text;

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
  Logger.log(priority.name[0] + ': ' + text);

  // Throw an Error and interrupt the execution if the log event had FATAL_ERROR
  // priority and we are not in test mode.
  if (priority.value === Priority.FATAL_ERROR.value && !this.testing) {
    this.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
    throw new Error(text);
  }
};

/**
 * Get the output of the log as an array of messages.
 *
 * @returns {string[]}
 */
Log.prototype.getOutput = function () {
  return this.events.map(function (e) {
    return e.toString();
  });
};

/**
 * Verify if the log contains at least an event with priority equal to or greater than
 * the specified priority.
 *
 * @param {!Priority} minimumPriority - The numeric value representing the priority limit.
 * @returns {boolean}
 */
Log.prototype.containsMinimumPriority = function (minimumPriority) {
  var i;

  for (i = 0; i < this.events.length; i++) {
    if (this.events[i].priority.value >= minimumPriority.value) {
      return true;
    }
  }
  return false;
};

/**
 * If the filter condition is met send all the logs collected to the specified email.
 *
 * @param {!string} to - The email address of the recipient of the email.
 * @param {!string} senderName - The name of the sender.
 */
Log.prototype.sendEmail = function (to, senderName) {
  if (this.containsMinimumPriority(this.emailMinimumPriority)) {
    this.add('Sending logs via email.', Priority.INFO);
    MailApp.sendEmail({
      to: to,
      subject: 'Logs for Google Contacts Events Notifications',
      body: this.getOutput().join('\n'),
      name: senderName
    });
    this.add('Email sent.', Priority.INFO);
  }
};

/**
 * A logged event.
 *
 * @param {Date} time - The time of the event.
 * @param {string} message - The message of the event.
 * @param {Priority} priority - The priority of the event.
 */
function LogEvent (time, message, priority) {
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
LogEvent.prototype.toString = function () {
  return '[' + Utilities.formatDate(this.time, Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm:ss') + ' ' + Session.getScriptTimeZone() + '] ' + this.priority.name[0] + ': ' + this.message;
};

/**
 * An enum of plurals for eventTypes.
 *
 * @readonly
 * @enum {string}
 */
var eventTypeNamePlural = {
  BIRTHDAY: 'birthdays',
  ANNIVERSARY: 'anniversaries',
  CUSTOM: 'custom events'
};

/**
 * A priority enum.
 *
 * @readonly
 * @enum {Object.<string,number>}
 */
var Priority = {
  NONE: {name: 'None', value: 0},
  INFO: {name: 'Info', value: 10},
  WARNING: {name: 'Warning', value: 20},
  ERROR: {name: 'Error', value: 30},
  FATAL_ERROR: {name: 'Fatal error', value: 40},
  MAX: {name: 'Max', value: 100}
};

/**
 * Enum for notification type.
 *
 * @readonly
 * @enum {number}
 */
var NotificationType = {
  PLAIN_TEXT: 0,
  HTML: 1
};

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
    self.numbers[0] = parseInt(matches[1], 10);
    self.numbers[1] = parseInt(matches[2], 10);
    self.numbers[2] = parseInt(matches[3], 10);
    self.preRelease = isIn(matches[4], [undefined, null]) ? '' : matches[4];
    self.metadata = isIn(matches[5], [undefined, null]) ? '' : matches[5];
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
 * @param {!SimplifiedSemanticVersion} comparedVersion - The version to compare.
 * @returns {number} - 1, 0 , -1 if this version number is greater than, equal to or smaller than the one passed as the parameter.
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

if (isIn(Array.prototype.extend, [undefined, null])) {
  /**
   * Merge an array at the end of an existing array.
   *
   * * Example:
   *         a = [1, 2, 3], b = [4, 5, 6];
   *         a.extend(b);
   *         a -> [1, 2, 3, 4, 5, 6]
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

if (isIn(String.prototype.format, [undefined, null])) {
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
      return isIn(args[number], [undefined, null])
        ? match
        : args[number]
      ;
    });
  };
}

if (isIn(String.prototype.replaceAll, [undefined, null])) {
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

if (isIn(Number.isInteger, [undefined, null])) {
  /**
   * Determine if a number is an integer.
   *
   * @param {number} n - The number to check.
   * @returns {boolean} - True if the number is an integer, false otherwise.
   */
  Number.isInteger = function (n) {
    return typeof n === 'number' && (n % 1) === 0;
  };
}

if (isIn(Date.prototype.addDays, [undefined, null])) {
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

// GLOBAL VARIABLES

/**
 * The version of the script.
 *
 * @type {!SimplifiedSemanticVersion}
 */
var version = new SimplifiedSemanticVersion(settings.developer.version);

var cache = new LocalCache();

// These URLs are used to access the files in the repository or specific pages on GitHub.
var baseRawFilesURL = 'https://raw.githubusercontent.com/' + settings.developer.repoName + '/' + settings.developer.gitHubBranch + '/';
var baseGitHubProjectURL = 'https://github.com/' + settings.developer.repoName + '/';
var baseGitHubApiURL = 'https://api.github.com/repos/' + settings.developer.repoName + '/';
var defaultProfileImageURL = baseRawFilesURL + 'images/default_profile.jpg';

// Convert user-configured hash to an array
var eventTypes = Object.keys(settings.notifications.eventTypes)
  .filter(function (x) { return settings.notifications.eventTypes[x]; });

// Build the indentation from the setting.
var indent = Array(settings.notifications.indentSize + 1).join(' ');

var inlineImages;

var log = new Log(Priority[settings.debug.log.filterLevel], Priority[settings.debug.log.sendTrigger]);

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
    'Other phone': 'Άλλο τηλέφωνο',
    'Home fax': 'Φαξ οικίας',
    'Work fax': 'Φαξ εργασίας',
    'Google voice': 'Google voice',
    'Pager': 'Τηλεειδοποίηση',
    'Home email': 'Προσωπικό email',
    'Work email': 'Επαγγελματικό email',
    'Other email': 'Άλλο email',
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
    // TODO: 'Google voice': '',
    // TODO: 'Pager': '',
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
    // TODO: 'Google voice': '',
    // TODO: 'Pager': '',
    // TODO: 'Home email': '',
    // TODO: 'Work email': '',
    // TODO: 'Other email': '',
    'It looks like you are using an outdated version of this script': 'Du scheinst eine veraltete Version dieses Skripts zu benutzen',
    'You can find the latest one here': 'Die aktuelle Version findest du hier', // Using feminime version of 'latest', because it refers to 'version'. There's possibility it won't fit into diffrent context.
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
    'It looks like you are using an outdated version of this script': 'Il semble que vous utilisez une ancienne version de ce script',
    'You can find the latest one here': 'Vous pouvez trouver la dernière version ici',
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
    'dd-MM-yyyy': 'วว-ดด-ปปปป',
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
 *
 * If the language or the chosen string is invalid return the string itself.
 *
 * @param {!string} str - String to attempt translation for.
 * @returns {string}
 */
function _ (str) {
  return i18n[settings.user.lang][str] || str;
}

/**
 * Return whether an item exists as a value in an object.
 *
 * @param {!any} item - The item to search the values for.
 * @param {!object} arr - The object to search in.
 * @returns {boolean} - Whether the item exists as a value in the object.
 */
function isIn (item, arr) {
  /*
   * Must use "indexOf" with values rather than "in" with keys, because e.g.
   * "null" and "undefined" can't be keys. No need for "typeof undefined"
   * syntax for comparing "undefined" as we are not targeting browsers, let
   * alone old ones.
   */
  return arr.indexOf(item) !== -1;
}

/**
 * Replace an event label string with its lowercased version, without
 * changing the prefix 'CUSTOM:' if it is present.
 *
 * @param {!string} label - The label to be lowercased.
 * @returns {string}
 */
function eventLabelToLowerCase (label) {
  if (label.indexOf('CUSTOM:') === 0) {
    return label.slice(0, 7) + label.slice(7).toLocaleLowerCase();
  } else {
    return label.toLocaleLowerCase();
  }
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
 * Get a `ContactsApp.Month`'s numerical representation.
 *
 * @param {!Object} month
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
 * Return an array of strings with duplicate strings removed.
 *
 * @param {!string[]} arr - The array containing the duplicates.
 * @returns {string[]} - The array without duplicates.
 */
function uniqueStrings (arr) {
  var seen = {};
  return arr.filter(function (str) {
    return seen.hasOwnProperty(str) ? false : (seen[str] = true);
  });
}

// MAIN FUNCTIONS

/**
 * Validate the settings, logging all problems found and stopping the script
 * execution if a FATAL_ERROR is thrown.
 */
function validateSettings () {
  var setting, calendarId;

  log.add('validateSettings() running.');

  setting = settings.user.googleEmail;
  if (!setting || !/^(?!YOUREMAILHERE)\S+@\S+\.\S+$/.test(setting)) {
    log.add('Your user.googleEmail setting is invalid!', Priority.FATAL_ERROR);
  }

  setting = settings.user.notificationEmail;
  if (!setting || !/^(?!YOUREMEAILHERE)\S+@(?!example)\S+\.\S+$/.test(setting)) {
    log.add('Your user.notificationEmail setting is invalid!', Priority.FATAL_ERROR);
  }

  switch (settings.user.eventSource) {
    case 'DEFAULT':
      // Get the calendar ID from Google Calendar.
      calendarId = CalendarApp.getAllCalendars().filter(function (cal) {
        // All the valid calendar IDs contain this string.
        return isIn('#contacts@group.v.calendar.google.com', cal.getId());
      }).map(function (cal) { return cal.getId(); });

      if (calendarId.length > 0) {
        settings.user.calendarId = calendarId[0];
      } else {
        log.add('Could not find the birthday calendar! Please check that you have enabled it and that your user.eventSource setting is correct!', Priority.FATAL_ERROR);
      }
      break;
    case 'CONTACTS_ONLY':
      settings.user.calendarId = 'addressbook#contacts@group.v.calendar.google.com';
      break;
    case 'CONTACTS_AND_GPLUS':
      settings.user.calendarId = '#contacts@group.v.calendar.google.com';
      break;
    default:
      settings.user.calendarId = settings.user.eventSource;
  }

  try {
    if (Calendar.Calendars.get(settings.user.calendarId) === null) {
      throw new Error('');
    }
  } catch (err) {
    log.add('Your user.eventSource setting is invalid!', Priority.FATAL_ERROR);
  }

  // emailSenderName has no restrictions.

  // lang has no restrictions.

  if (typeof settings.user.accessGooglePlus !== 'boolean') {
    log.add('Your user.accessGooglePlus setting is invalid!', Priority.ERROR);
    // Default value.
    settings.user.accessGooglePlus = true;
  }

  setting = settings.notifications.hour;
  if (!Number.isInteger(setting) || setting < 0 || setting >= 24) {
    log.add('Your notifications.hour setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.hour = 6;
  }

  // It would be quite difficult to test the timeZone.

  setting = settings.notifications.anticipateDays;
  if (
    setting.constructor !== Array ||
    setting.filter(function (x) {
      return Number.isInteger(x) && x >= 0;
    }).length !== setting.length
  ) {
    log.add('Your notifications.anticipateDays setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.anticipateDays = [0, 1, 7];
  }

  setting = settings.notifications.eventTypes;
  if (
    typeof setting.BIRTHDAY !== 'boolean' ||
    typeof setting.ANNIVERSARY !== 'boolean' ||
    typeof setting.CUSTOM !== 'boolean'
  ) {
    log.add('Your notifications.eventTypes setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.eventTypes = {
      BIRTHDAY: true,
      ANNIVERSARY: false,
      CUSTOM: false
    };
  }

  setting = settings.notifications.maxEmailsCount;
  if (!Number.isInteger(setting) || setting < -1) {
    log.add('Your notifications.maxEmailsCount setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.maxEmailsCount = -1;
  }

  setting = settings.notifications.maxPhonesCount;
  if (!Number.isInteger(setting) || setting < -1) {
    log.add('Your notifications.maxPhonesCount setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.maxPhonesCount = -1;
  }

  setting = settings.notifications.indentSize;
  if (!Number.isInteger(setting) || setting <= 0) {
    log.add('Your notifications.indentSize setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.indentSize = 4;
  }

  if (typeof settings.notifications.compactGrouping !== 'boolean') {
    log.add('Your notifications.compactGrouping setting is invalid!', Priority.ERROR);
    // Default value.
    settings.notifications.compactGrouping = true;
  }

  setting = settings.debug.log.filterLevel;
  if (typeof Priority[setting] !== 'object') {
    log.add('Your debug.log.filterLevel setting is invalid!', Priority.ERROR);
    // Default value.
    settings.debug.log.filterLevel = 'INFO';
  }

  setting = settings.debug.log.sendTrigger;
  if (typeof Priority[setting] !== 'object') {
    log.add('Your debug.log.sendTrigger setting is invalid!', Priority.ERROR);
    // Default value.
    settings.debug.log.sendTrigger = 'ERROR';
  }

  setting = settings.debug.testDate;
  if (setting.constructor !== Date) {
    log.add('Your debug.log.testDate setting is invalid!', Priority.ERROR);
    // Default value.
    settings.debug.log.testDate = new Date();
  }
}

/**
 * Returns an array with the events happening in the calendar with
 * ID `calendarId` on date `eventDate`.
 *
 * @param {!Number} year - The full year of the date of the event.
 * @param {!Number} month - The number representing the month of the date of the event, starting from 0.
 * @param {!Number} day - The number of the day of the date of the event.
 * @param {!string} calendarId - The id of the calendar from which events are collected.
 * @returns {Object[]} - A list of rawEvent Objects.
 */
function getEventsOnDate (year, month, day, calendarId) {
  var eventCalendar, eventDate, startDate, endDate, events;

  // Verify the existence of the events calendar.
  try {
    eventCalendar = Calendar.Calendars.get(calendarId);
    if (eventCalendar === null) {
      throw new Error('');
    }
  } catch (err) {
    log.add('The calendar with ID "' + calendarId + '" is not accessible: check your calendarId value!', Priority.FATAL_ERROR);
  }

  eventDate = dateWithTimezone(year, month, day, 0, 0, 0, eventCalendar.timeZone);

  // Query the events calendar for events on the specified date.
  try {
    // Look for events from 00:00:00 to 00:01:00 of the specified day.
    startDate = Utilities.formatDate(eventDate, eventCalendar.timeZone, 'yyyy-MM-dd\'T\'HH:mm:ssXXX');
    endDate = Utilities.formatDate(new Date(eventDate.getTime() + 60000), eventCalendar.timeZone, 'yyyy-MM-dd\'T\'HH:mm:ssXXX');
    log.add('Looking for contacts events on ' + eventDate + ' (' + startDate + ' / ' + endDate + ')', Priority.INFO);
  } catch (err) {
    log.add(err.message, Priority.FATAL_ERROR);
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
 * Generate the content of an email to the user containing a list of the events
 * of his/her contacts scheduled on a given date.
 *
 * @param {?Date} forceDate - If this value is not null it's used as 'now'.
 * @returns {Object.<string,any>} - The content of the email.
 */
function generateEmailNotification (forceDate) {
  var now, events, contactList, subjectPrefix, subjectBuilder, subject,
    bodyPrefix, bodySuffixes, bodyBuilder, body, htmlBody, htmlBodyBuilder,
    contactIter, runningOutdatedVersion;

  log.add('generateEmailNotification() running.', Priority.INFO);
  now = forceDate || new Date();
  log.add('Date used: ' + now, Priority.INFO);

  events = [].concat.apply(
    [],
    settings.notifications.anticipateDays
      .map(function (days) {
        var date = now.addDays(days);
        return getEventsOnDate(
          parseInt(Utilities.formatDate(date, settings.notifications.timeZone, 'yyyy'), 10),
          parseInt(Utilities.formatDate(date, settings.notifications.timeZone, 'MM'), 10) - 1,
          parseInt(Utilities.formatDate(date, settings.notifications.timeZone, 'dd'), 10),
          settings.user.calendarId
        );
      })
  );

  if (events.length === 0) {
    log.add('No events found. Exiting now.', Priority.INFO);
    return null;
  }
  log.add('Found ' + events.length + ' events.', Priority.INFO);

  contactList = [];

  /*
   * Build a list of contacts (with complete information) from the event list.
   *
   * **Note:** multiple events can refer to the same contact.
   */
  events.forEach(function (rawEvent) {
    var eventData;

    if (!rawEvent.gadget || !rawEvent.gadget.preferences) {
      log.add(rawEvent, Priority.INFO);
      log.add('The structure of this event cannot be parsed.', Priority.FATAL_ERROR);
    }
    eventData = rawEvent.gadget.preferences;

    // Look if the contact of this event is already in the contact list.
    for (contactIter = 0; contactIter < contactList.length; contactIter++) {
      if (
        (
          eventData['goo.contactsContactId'] !== null &&
          eventData['goo.contactsContactId'] === contactList[contactIter].contactId
        ) ||
        (
          eventData['goo.contactsProfileId'] !== null &&
          eventData['goo.contactsProfileId'] === contactList[contactIter].gPlusId
        )
      ) {
        // FOUND!
        // Integrate this event information into the contact.
        break;
      }
    }
    if (contactIter === contactList.length) {
      // NOT FOUND!
      // Add a new contact to the contact list and store all the info in that contact.
      contactList.push(new MergedContact());
    }
    contactList[contactIter].getInfoFromRawEvent(rawEvent);
  });

  // Iterate by reverse index to allow safe splicing from within the loop
  contactIter = contactList.length;
  while (contactIter--) {
    if (!contactList[contactIter].events || !contactList[contactIter].events.length) {
      contactList.splice(contactIter, 1);
    }
  }
  if (contactList.length === 0) {
    log.add('No contacts with valid events found. Exiting now.', Priority.INFO);
    return null;
  }
  log.add('Found ' + contactList.length + ' contacts with matching events.', Priority.INFO);

  // Give a default profile image to the contacts without one.
  contactList.forEach(function (contact) {
    contact.data.merge(new ContactDataDC(
      null,                                             // Full name.
      null,                                             // Nickname.
      defaultProfileImageURL                            // Profile photo URL.
    ));
  });

  // Start building the email notification text.
  subjectPrefix = _('Events') + ': ';
  subjectBuilder = contactList.map(function (contact) { return contact.data.getProp('fullName'); });
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

  settings.notifications.anticipateDays
    .forEach(function (daysInterval) {
      var date, formattedDate;

      date = now.addDays(daysInterval);
      formattedDate = Utilities.formatDate(date, settings.notifications.timeZone, _('dd-MM-yyyy'));

      eventTypes.forEach(function (eventType) {
        var plaintextLines, htmlLines, whenIsIt;

        // Get all the matching 'eventType' events.
        log.add('Checking ' + eventTypeNamePlural[eventType] + ' on ' + formattedDate, Priority.INFO);

        plaintextLines = contactList
          .map(function (contact) { return contact.getLines(eventType, date, NotificationType.PLAIN_TEXT); })
          .filter(function (lines) { return lines.length > 0; });
        htmlLines = contactList
          .map(function (contact) { return contact.getLines(eventType, date, NotificationType.HTML); })
          .filter(function (lines) { return lines.length > 0; });
        if (plaintextLines.length === 0 || htmlLines.length === 0) {
          log.add('No events found on this date.', Priority.INFO);
          return;
        }
        log.add('Found ' + plaintextLines.length + ' ' + eventTypeNamePlural[eventType], Priority.INFO);
        // Build the headers of 'eventType' event grouping by date.
        bodyBuilder.push('\n * ');
        htmlBodyBuilder.push('<dt style="margin-left:0.8em;font-style:italic">');
        whenIsIt = eventTypeNamePlural[eventType].charAt(0).toUpperCase() + eventTypeNamePlural[eventType].slice(1);
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
    log.add('Building the email notification.', Priority.INFO);
    runningOutdatedVersion = isRunningOutdatedVersion();
    subject = subjectPrefix + subjectBuilder.join(' - ');
    body = [bodyPrefix, '\n']
      .concat(bodyBuilder)
      .concat(['\n\n ', bodySuffixes[0], '\n '])
      .concat('\n', runningOutdatedVersion ? [bodySuffixes[1], ' ', bodySuffixes[2], ':\n', baseGitHubProjectURL + 'releases/latest', '\n '] : [])
      .join('');
    htmlBody = ['<h3>', htmlEscape(bodyPrefix), '</h3><dl>']
      .concat(htmlBodyBuilder)
      .concat(['</dl><hr/><p style="text-align:center;font-size:smaller"><a href="' + baseGitHubProjectURL + '">', htmlEscape(bodySuffixes[0]), '</a>'])
      .concat(runningOutdatedVersion ? ['<br/><br/><b>', htmlEscape(bodySuffixes[1]), ' <a href="', baseGitHubProjectURL, 'releases/latest', '">', htmlEscape(bodySuffixes[2]), '</a>.</b></p>'] : ['</p>'])
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
 * <div style="clear:both"></div>
 * Send an email notification to the user containing a list of the events
 * of his/her contacts scheduled for the next days.
 *
 * @param {?Date} forceDate - If this value is not null it's used as 'now'.
 */
function main (forceDate) {
  log.add('main() running.', Priority.INFO);

  validateSettings();

  var emailData = generateEmailNotification(forceDate);

  // If generateEmailNotification returned mail content send it.
  if (emailData !== null) {
    log.add('Sending email...', Priority.INFO);
    MailApp.sendEmail({
      to: settings.user.notificationEmail,
      subject: emailData.subject,
      body: emailData.body,
      htmlBody: emailData.htmlBody,
      inlineImages: emailData.inlineImages,
      name: settings.user.emailSenderName
    });

    log.add('Email sent.', Priority.INFO);
  }

  // Send the log if the debug options say so.
  log.sendEmail(settings.user.notificationEmail, settings.user.emailSenderName);
}

/**
 * Execute the `main()` function without forcing any date as "now".
 */
function normal () { // eslint-disable-line no-unused-vars
  log.add('normal() running.', Priority.INFO);
  main(null);
}

/**
 * Execute the `main()` function forcing a given date (`settings.debug.testDate`) as "now".
 */
function test () { // eslint-disable-line no-unused-vars
  log.add('test() running.', Priority.INFO);
  main(settings.debug.testDate);
}

// NOTIFICATION SERVICE FUNCTIONS

/**
 * Start the notification service.
 */
function notifStart () { // eslint-disable-line no-unused-vars
  validateSettings();
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
    log.add('Failed to start the notification service: make sure that settings.notifications.timeZone is a valid value.', Priority.FATAL_ERROR);
  }
  log.add('Notification service started.', Priority.INFO);
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
  log.add('Notification service stopped.', Priority.INFO);
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

/**
 * Generate a date with a given timezone id.
 *
 * @param {!Number} year - Full year of the date.
 * @param {!Number} month - Month of the date, starting from 0.
 * @param {!Number} day - Day of the date, starting from 1.
 * @param {!Number} hour - Hour of the date.
 * @param {!Number} minute - Minute of the date.
 * @param {!Number} second - Second of the date,
 * @param {String} timezoneId - A valid IANA timezone identifier.
 *
 * @returns {Date} - The date corresponding to the input.
 */
function dateWithTimezone (year, month, day, hour, minute, second, timezoneId) {
  var date, offset;

  // Generate the date as in the UTC0 timezone.
  date = new Date(Date.UTC(year, month, day, hour, minute, second));
  // Calculate the offset for the given timezone.
  offset = Utilities.formatDate(date, timezoneId, 'Z');
  // Evaluate the offset (in minutes).
  offset = (offset[0] === '-' ? -1 : +1) * (parseInt(offset[1] + offset[2], 10) * 60 + parseInt(offset[3] + offset[4], 10));
  // Apply the offse to the UTC date to get the correct date.
  date = new Date(date.getTime() - offset * 60000);
  return date;
}
