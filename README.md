# GoogleCalendarBirthdayNotifications
Receive email notifications before your contacts birthday.

## How to setup
Copy the content of [this file](https://raw.githubusercontent.com/GioBonvi/GoogleCalendarBirthdayNotifications/master/code.gs).  
Open www.script.google.com and login if requested, then paste the code into the page.

Now read carefully the code you've pasted. At the beginning of the file you will find some lines you need to modify along with many lines of instructions. Edit the values as explained.  
You should modify the values of these variables:

 - myEmail
 - myTimeZone
 - anticipateHours
 - subjectPrefix
 - bodyPrefix
 - bodySuffix
 
Now click File->Save in the menu and enter a name for the script (it doesn't really matter, just name it so that you'll recognize if you find it in the future).

Now that the script is saved in you Google Drive we need to activate it. To do so click the menu Resources->Advanced Google services.  
In the popup which will open set "Google Calendar API" to "enabled" (click the switch on its row on the right). We are almost done! Click on the link which says "Google Developer Console": you will be taken to another page. In this page search for "Google Calendar API" and open it. Now click "Enable" at the top of the window and close this page.

This should be enough to enable the app to do its work: now the last step is granting it the rights it needs. To do so click on the menu Run->start. You will be prompted to "Review authorizations": do it and click "Allow".

From this moment on you will always receive an email before any of your contacts' birthday (You should have set how many hours before at the beginning).

To stop receiving these notifications simply open the script (which you'll find [in Google Drive](https://drive.google.com/drive/) if you haven't moved it) and click the menu Run->stop.

## License
GoogleCalendarBirthdayNotifications is licensed under the MIT license (see the [LICENSE FILE](https://github.com/GioBonvi/GoogleCalendarBirthdayNotifications/blob/master/LICENSE)).
