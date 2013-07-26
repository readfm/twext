BingAccessToken directory contains two php files: accessToken.php, firebase.php
accessToken.php is a script that gets the access token from Bing api and save it into firebase.
firebase.php is an api allow access to firebase with php using its REST interface.

accessToken script must be executed every fixed time that less than 10 minutes, because the token expires every 10 minutes.
The token is valid for use within its 10 mins life period, even if a new token is generated before the old one is expired.

Don't make the script run every exact 10 minutes, this may cause expiration error because:
1. The token is expired in 599 seconds.
2. You need to leave some time between new token creation and old one expiration to avoid error in case the user requested a translation while the token is generated and before saving it into firebase. In this case, The translate request will be sent with the old token which needed to be still valid.

The script is scheduled on xc.cx linux server to be executed every 06 minutes using crontab jobs.
Six minutes is chosen just to make the script run in fixed minutes every hour(eg: 6,12,18...,60,6,12...), but any number less than 10 is accepted.

To Apply this to any server, follow the next steps:
- Put the BingAccessToken directory in a defined path on the server.
- Open the terminal and execute the command: crontab -e
- Add this line to the task list: */06 * * * * /phpPath /scriptPath/BingAccessToken/accessToken.php

where "phpPath" is the path of the php installation.
      "scriptPath" is the path where the folder BingAccessToken exists.
      "06" is the number of minutes between script executions, put any number less than 10