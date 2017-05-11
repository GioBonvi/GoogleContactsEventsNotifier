# GoogleCalendarBirthdayNotifications
Receive email notifications before your contacts birthday.

## How to setup

### Enable the calendar
First of all you need to enable your contacts birthday calendar in you Google Calendar (see [this](https://support.google.com/calendar/answer/6084659?hl=en)).

### Create the script
Copy the content of [this file](https://raw.githubusercontent.com/GioBonvi/GoogleCalendarBirthdayNotifications/master/code.gs).  
Open [Google Script](https://script.google.com) and login if requested, then paste the code into the page.

### Customize the script
Now read carefully the code you've pasted. At the beginning of the file you will find some lines you need to modify along with many lines of instructions. Edit the values as explained.  
You must adjust the values of these variables:

-   myEmail
-   calendarId
-   myTimeZone
-   notificationHour
-   anticipateDays

Now click File->Save in the menu and enter a name for the script (it doesn't really matter, just name it so that you'll recognize if you find it in the future).

### Activate API for the script
Now that the script is saved in you Google Drive we need to activate it. To do so click the menu Resources->Advanced Google services.  
In the popup which will open set "Google Calendar API" to "enabled" (click the switch on its row on the right). We are almost done! Click on the link which says "Google API Console": you will be taken to another page. In this page search for "Google Calendar API" and open it. Now click "Enable" at the top of the window and close this page.

### Grant rights to the script
This should be enough to enable the app to do its work: now the last step is granting it the rights it needs. To do so click on the menu Run->start. You will be prompted to "Review authorizations": do it and click "Allow".  
You might receive a first email immediately: the following ones will be sent at the hour you secified.  
From this moment on you will always receive an email before any of your contacts' birthday (You should have set how many hours before at the beginning).

### Bonus (Translation)
As written in the script you can translate the email notification into your own language by editing the text at the lines marked with ````// TRANSLATE HERE````.

### Bonus (Stop notifications)
To stop receiving these notifications simply open the script (which you'll find [in Google Drive](https://drive.google.com/drive/) if you haven't moved it) and click the menu Run->stop.

## Bug and error reporting, help requests
First of all _before submitting a new error, bug or help request_, please, __verify that you followed [the instructions](https://giobonvi.github.io/GoogleCalendarBirthdayNotifications/) to the letter.__

To report a bug or an error or to request help with this script please use [this project GitHub issue page](https://github.com/GioBonvi/GoogleCalendarBirthdayNotifications/issues).  
I will be notified immediately and will provide help as soon as possible.

In the text of the message please include:
-   A __meaningful description of the problem__. What did you do? What happened? What did you expect to happen instead?
-   A __full copy of any error message you received__. Please be advised that it could contain personal information such as your email: obscure or remove them as alla the issues and relative messages are publicly visible.
-   The __full _execution transcript_ and _log_ of the script___. To obtain them open your script, click "Run" > "checkBirthdays" in the menu at the top of the page: when the execution ends (the yellow message saying "Execution of the function..." will disappear) click "View" > "Execution transcript" and copy all the text in the window that will pop up, then click "View" > "Log" and copy all that text as well.

I really need these informations: without them I will not be able to help you.

### Bonus (Test)
If you want to test the script, but in these days none of your contacts have a birthday you can use the ```test()``` function.

To do so, open the script and scroll to the bottom: you will find the ```test()``` function there, with some instructions.  
You just need to replace the date you will see written in the function with the date you want to test, then click "Run" > "test" in the menu at the top of the page.  
If everything went right you should receive a birthday notification exactly like if today was the date you set.

## License
GoogleCalendarBirthdayNotifications is licensed under the MIT license (see the [LICENSE FILE](https://github.com/GioBonvi/GoogleCalendarBirthdayNotifications/blob/master/LICENSE)).
