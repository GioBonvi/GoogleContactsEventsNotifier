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
You should modify the values of these variables:

-   myEmail
-   myTimeZone
-   notificationHour
-   anticipateDays

Now click File->Save in the menu and enter a name for the script (it doesn't really matter, just name it so that you'll recognize if you find it in the future).

### Activate API for the script
Now that the script is saved in you Google Drive we need to activate it. To do so click the menu Resources->Advanced Google services.  
In the popup which will open set "Google Calendar API" to "enabled" (click the switch on its row on the right). We are almost done! Click on the link which says "Google Developer Console": you will be taken to another page. In this page search for "Google Calendar API" and open it. Now click "Enable" at the top of the window and close this page.

### Grant rights to the script
This should be enough to enable the app to do its work: now the last step is granting it the rights it needs. To do so click on the menu Run->start. You will be prompted to "Review authorizations": do it and click "Allow".  
You might receive a first email immediately: the following ones will be sent at the hour you secified.  
From this moment on you will always receive an email before any of your contacts' birthday (You should have set how many hours before at the beginning).

### Bonus (Translation)
As written in the script you can translate the email notification into your own language by editing the text at the lines marked with ````// TRANSLATE HERE````.

### Bonus (Stop notifications)
To stop receiving these notifications simply open the script (which you'll find [in Google Drive](https://drive.google.com/drive/) if you haven't moved it) and click the menu Run->stop.

## License
GoogleCalendarBirthdayNotifications is licensed under the MIT license (see the [LICENSE FILE](https://github.com/GioBonvi/GoogleCalendarBirthdayNotifications/blob/master/LICENSE)).
