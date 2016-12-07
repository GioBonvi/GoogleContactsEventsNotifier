// Thanks to this script you are going to receive an email before the birthday of each of your contacts.
// The script is easily customizable via some variables listed below.

// First of all, the script needs to know your email address (Notifications will be sent to this address).
var myEmail = "insertyouremailhere@myfakeemail.com";

// Spcify your time zone.
var myTimeZone = "GMT+1";

// Specify how many hours before the midnight of the birthday-day you want to receive the email.
// The default is 24 hours before.
var anticipateHours = 24
// The script needs this value in milliseconds. Do not edit the following line.
var anticipate = 1000 * 60 * 60 * anticipate;

// The subject of the email you'll receive will be: "subjectPrefix - NAME1 - NAME2 ..." (e.g "Birthday: John Doe - John Smith")
// Where NAME1, NAME2 and so on will be the full names of your contacts who take years,
// while subjectPrefix is a short text you can customize at the next line.
var subjectPrefix = "Birthday: ";

// The body of the email will be:

/*  
bodyPrefix

* NAME1 (EMAILADDRESS1)
* NAME2 (EMAILADDRESS2)
...

bodySuffix
*/

/*
e.g:  

Hey! Just a little reminder; it's almost time to wish happy birthday to:

* John Doe (johndoe@gmail.com)
* John Smith (johnsmith@gmail.com)
...

Google Calendar Contacts Birthday Notification by Giorgio Bonvicini
*/

// You can edit bodyPrefix and bodySuffix below this explaination.
// Keep all the text between these '<p>' and '</p>' strings (without quotes).
// If you want to go to a new line insert '<br>' (without quotes). (e.g "<p>First line<br>Second line</p>")
// If you want to make some words bold surrond them between '<b>' and '</b>' (without quotes). (e.g "<p>This is normal, <b>this is bold</b></p>")
// If you want to make some words italics surrond them between '<i>' and '</i>' (without quotes). (e.g "<p>This is normal, <i>this is italic</i></p>")
var bodyPrefix = "<p>Hey! Just a little reminder; it's almost time to wish <i>happy birthday</i> to:</p>";
var bodySuffix = "<br><br><p><center>Google Calendar Contacts Birthday Notification<br>by Giorgio Bonvicini<center></p>";

// END OF THE CUSTOMIZATION.
// There is no need to go further: the script will work if you inserted valid values up until here, however feel free to take a peek at my code ;)

function checkBirthdays()
{
  // Unique ID of the calendar containing birthdays.  
  var calendarId = '#contacts@group.v.calendar.google.com';
  
  var now = new Date();
  
  // Set the filter (We don't want every event in the calendar, just those happening tomorrow).
  var optionalArgs = {
    // Filter only events happening between now...
    timeMin: Utilities.formatDate(now, myTimeZone, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    // ... and the next 24 hours.
    timeMax: Utilities.formatDate(new Date(now.getTime() + anticipate), myTimeZone, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    // Treat recurring events as single events.
    singleEvents: true
  };
  
  // Get all the matching events.
  var birthdays = Calendar.Events.list(calendarId, optionalArgs).items;
  
  // If there is at least an event tomorrow...
  if (birthdays.length > 0)
  {
    // Build the subject of the email.
    var subjectBuilder = [];
    // Build the body of the email.
    var bodyBuilder = [bodyPrefix, "<ul>"];
    
    for (var i = 0; i < birthdays.length; i++)
    {
      var data = birthdays[i].gadget.preferences;
      subjectBuilder.push(data['goo.contactsFullName']);
      bodyBuilder.push("<li>" + data['goo.contactsFullName'] + " (" + data['goo.contactsEmail'] + ")</li>");
    }
    
    bodyBuilder.push("</ul>", bodySuffix);
    
    // Send the email.
    MailApp.sendEmail(
      myEmail,
      subjectPrefix + subjectBuilder.join(" - "),
      bodyBuilder.join(""), {
      htmlBody: bodyBuilder.join("")
    });
  }
}


// Start the notifications.
function start() {
    ScriptApp.newTrigger("checkBirthdays")
      .timeBased()
      .everyDays(anticipateHours / 24)
      .create();
}


// Stop the notifications.
function stop()
{
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}
