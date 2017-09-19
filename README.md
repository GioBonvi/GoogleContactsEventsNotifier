# Google Contacts Events Notifier

![Logo](images/Logo_alpha.png)

Receive customized email notifications to alert you about incoming birthdays or
other events of your Google contacts.

Have you ever wondered why on Earth would Google Calendar provide a calendar to
remind you of your contact birthdays, but without letting you set up notifications
for its events?  
I did. And after hours of fruitless searching and browsing I found [a post in
the Google Help Forum][Original Google Help Forum Post] which seemed to provide
a solution, however it did not quite work.

This project takes inspiration from that code to solve the problem of the
missing notifications on Google Calendar Birthday Calendar.

## How to setup

### Enable the calendar

First of all you need to enable your contacts birthday and events calendar in
you Google Calendar (read [this Google help page][Google setup birthday
calendar] to know how to do it).

### Create the script

Copy the whole content of [this file][Main code file].  
Open [Google Script][Google scripts website] and login if requested, then paste
the code into the page.

### Customize the script

Now read carefully the code you've pasted. At the top of the file you will find
some lines you need to modify along with many lines of instructions. Edit the
values as explained by the instructions.  

Once you're done editing the variables click File->Save in the menu and enter a
name for the script (it doesn't really matter, just name it so that you'll
recognize if you find it in the future).

The customization variables are divided in three lists.

#### Mandatory customization

This is the first list you will find and contains some variables than you
**must** initialize correctly, otherwise the script will not work at all.  
These variables are:

- `myGoogleEmail`
- `myEmail`
- `calendarId`

#### Optional customization

This second list of variables contains some variables than you could leave as
they are, but you are warmly encouraged to edit them, so as to fit your exact
needs.  
These variables are:

- `emailSenderName`
- `myTimeZone`
- `notificationHour`
- `anticipateDays`
- `lang`
- `eventTypes`
- `identSize`

#### Debugging options

This list only contains some variables used to debug and troubleshoot the
script when it does not work as intended. Generally you should not need to
edit these values, but you may be asked to do so if you submit a help
request.  
These variables are:

- `noLog`
- `sendLog`
- `fakeTestDate`

### Activate API for the script

Now that the script is saved in your Google Drive folder we need to activate it.
To do so click the menu "Resources" -> "Advanced Google services".  
In the popup which will open set "Google Calendar API" to "enabled" (click the
switch on its row on the right).  
Once you have done this click on the link which says "Google API Console": you
will be taken to another page. In this page search for "Google Calendar API" and
open it. Now click "Enable" at the top of the window and close this page.  
That's it for this step.

**Important note**: please double check that you have performed **both** steps
correctly as this step seems to be the cause of many reported errors.

### Grant rights to the script

We have given the script access to the resource it needs to work: now the last
step is granting it the rights to access those resources. To do so click on the
menu "Run" -> "start". You will be prompted to "Review authorizations": do it
and click "Allow".  
You might receive a first email immediately: the following ones will be sent at
the hour you specified.  
From this moment on you will always receive an email before any of your
contacts' birthday (You should have set how many days before at the beginning).

### Bonus (Translation)

If you want to add a new translation of the notifications, open your script,
find the line `var i18n` and have a look at the structure of the translation
object and at the instructions at the end.

To add a new language:

- find the block of code which represents one existing translation and copy it,
  for example:  

  ```javascript
  'it': {
    'Age': 'Età',
    ...
    'Main phone': 'Telefono principale',
  },
  ```

- paste it just below itself, like this:

  ```javascript
  'it': {
    'Age': 'Età',
    ...
    'Main phone': 'Telefono principale',
  },
  'it': {
    'Age': 'Età',
    ...
    'Main phone': 'Telefono principale',
  },
  ```

- replace the language code of your translation with your language code and
  proceed to translate every item in the list, leaving the string on the left of
  the `:` unchanged and translating the one on the right, like this:

  ```javascript
  'it': {
    'Age': 'Età',
    ...
    'Main phone': 'Telefono principale',
  },
  'de' : {
    'Age': 'Alter',
    ...
    'Main phone': 'Hauptnummer',
  },
  ```

If you want to share your translation with other users please open an issue or a
pull request on [Github][Project main page]. I will be glad to add your
translation to the script.

### Bonus (Stop notifications)

To stop receiving these notifications simply open the script (which you'll find
[in Google Drive][Google Drive website] if you haven't moved it) and click the
menu "Run" -> "stop".

## Bug and error reporting, help requests

First of all _before submitting a new error, bug or help request_, please,
__verify that you followed [the instructions][Project documentation] to the
letter.__

To report a bug or an error or to request help with this script please use [this
project GitHub issue page][Project issue page]: I will be notified immediately
and will provide help as soon as possible.

In the text of the message please follow the [template provided][Issue template
file] and include:

- A __meaningful description of the problem__. What did you do? What happened?
  What did you expect to happen instead?
- A __full copy of any error message you received or of the thing that went
  wrong__. Please be advised that it could contain personal information such as
  your email: obscure or remove them as all the issues and relative messages are
  publicly visible.

I really need these information: without them I will not be able to help you.

### Unresponsive help requests

If you open a help request issue please do not abandon it until it's been solved
and closed. If you want to close it before explicitly state this intention with
a message in the issue.

Issues marked with the "help request" that are unresponsive will be sent a
reminder message after three days since the last message from the user and the
issue will be marked with the "unresponsive" tag. If the user still does not
respond to the issue, after a month the issue will be closed.

If you want to re-open a closed "help request" issue ask for this by commenting
on it.  
Only the user which has originally opened the issue can ask for it to be
re-opened.

### Bonus (Test)

If you want to test the script, but in these days none of your contacts have a
birthday you can use the ```test()``` function.

To do so, open the script and edit the `fakeTestDate` variable in the debugging
configuration section. You just need to replace the example date with the date
you want to test, then click "Run" -> "test" in the menu at the top of the page.
If everything went right you should receive a birthday notification exactly like
if today was the date you set.

## Contributing

Google Contacts Events Notifier is an open source project: if you want to
know how to contribute please read the [CONTRIBUTING][Contributing file] file.

## License

Google Contacts Events Notifier is licensed under the [MIT license][License
file].

## Credits

- Google user ajparag for the [code][Original Google Help Forum
  post] that inspired this project;
- [rowanthorpe (Rowan Thorpe)][GitHub rowanthorpe], who heavily
  refactored the code adding many amazing features I had never thought of;
- those users who provided translations for the script:
  - [rowanthorpe (Rowan Thorpe)][GitHub rowanthorpe] - Greek;
  - [lboullo0 (Lucas)][Github lboullo0] - Spanish;
  - [muzavan (Muhammad Reza Irvanda)][Github muzavan] - Indonesian;
  - [DrKrakower][Github DrKrakower] and Simone Sottopietra - German;
  - [cezarylaksa][Github cezarylaksa] and [baatochan (Bartosz
    Rodziewicz)][Github baatochan] - Polish;
  - [JayForce][GitHub JayForce] - French;
- all of the contributors that you can find [here][Project contributors page];

[Project main page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier
[Project documentation]: https://giobonvi.github.io/GoogleContactsEventsNotifier
[Project issue page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier/issues
[Project contributors page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier/graphs/contributors
[Main code file]: code.gs
[Issue template file]: .github/ISSUE_TEMPLATE.md
[Contributing file]: .github/CONTRIBUTING.md
[License file]: LICENSE
[Google Scripts website]: https://script.google.com
[Google Drive website]: https://drive.google.com/drive/
[Google setup birthday calendar]: https://support.google.com/calendar/answer/6084659?hl=en
[Original Google Help Forum Post]: https://productforums.google.com/d/msg/calendar/OaaO2og9m5w/2VgNNNF5BwAJ
[GitHub rowanthorpe]: https://github.com/rowanthorpe
[Github lboullo0]: https://github.com/lboullo0
[Github muzavan]: https://github.com/muzavan
[Github DrKrakower]: https://github.com/DrKrakower
[Github cezarylaksa]: https://github.com/cezarylaksa
[Github baatochan]: https://github.com/baatochan
[Github JayForce]: https://github.com/JayForce