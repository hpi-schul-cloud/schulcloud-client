# Schul-Cloud Client  
_An implementation of the Schul-Cloud client with NodeJS and Express._  
  
Dev: ![Travis Status](https://travis-ci.com/schul-cloud/schulcloud-client.svg?branch=master)<br>  
Production: ![Travis Status](https://travis-ci.com/schul-cloud/schulcloud-client.svg?branch=production)  
  
## Requirements  
  
* node.js 8.7 or later (You can install it from https://nodejs.org/en/download/)

You might take a look at the [Dockerfile](https://github.com/schul-cloud/schulcloud-client/blob/master/Dockerfile) to see some more dependencies and latest version informations.

## Setup  
  
German docs on installing: [Setup SC](https://docs.schul-cloud.org/display/SCDOK/Setup)
  
Short version:

1. Clone directory into local folder  
2. Go into the cloned folder and enter `npm install`  
3. Install nodemon and gulp globally by entering `npm install -g nodemon gulp`  
  
## Run  
  
1. Start the [schul-cloud server](https://github.com/schulcloud/schulcloud-server)  
2. Go into project folder
3. run `gulp watch` to run gulp
4. Set the ENV-variable `TZ=Europe/Berlin` (for windows use `set TZ=Europe/Berlin`). You can also set the variables `SC_TITLE=HPI Schul-Cloud` and `SC_SHORT_TITLE=Schul-Cloud` if you want.
5. run `npm run watch` to boot the application
6. go to `http://localhost:3100`

**Alternative with browser-sync**

1. run `gulp watch reload` to run gulp with browser sync. It also starts the node-client-server.
2. go to `http://localhost:7000`
  
For connecting to the [SchulCloud Calendar-Service](https://github.com/schul-cloud/schulcloud-calendar) you have to set `export CALENDAR_SERVICE_ENABLED=true`.  
  
For connecting to the [SchulCloud Notification-Service](https://github.com/schul-cloud/node-notification-service) you have to set `export NOTIFICATION_SERVICE_ENABLED=true`.  
  
For activating Google Analytics tracking you have to set `export GOOGLE_ANALYTICS_TRACKING_ID={TRACKING_ID}`.  
  
## Theming  
  
Add Themes to /theme directory. Call gulp and node with SC_THEME set to name of directory.  
then clear build files and gulp cache with `gulp clear`  
  
### Windows  
  run `set SC_THEME={themeName}` without spaces around the equal sign!  
  
## Testing  
  
**Information**: Please make sure that all your changes works on [Chrome](https://www.google.de/chrome/browser/desktop/index.html) , [Firefox](https://www.mozilla.org/de/firefox/new/) and [Safari](https://www.apple.com/de/safari/)!  
For html/css components please check [caniuse](https://caniuse.com/).  
  
1. Set the password for the demo user `schueler@schul-cloud.org`  
  Ubuntu/Mac: `export SC_DEMO_USER_PASSWORD={PASSWORD}` (Without braces)  
    Windows: `set SC_DEMO_USER_PASSWORD={PASSWORD}` (Without braces)  
2. run `npm run test`  
3. If you want to use another backend url than localhost, set the `BACKEND_URL` and `PUBLIC_BACKEND_URL` environment variables (see 1)  
4. If you want to list the coverage, run `npm run coverage`  

---
**Frontend Testing**
We are currently using [nightwatch.js](http://nightwatchjs.org) for frontend testing. The current api documentation can be found [here](http://nightwatchjs.org/api).
1. Start a client server with `npm run watch`
2. Open another command line and type `npm run frontendTests` to run tests against chrome and firefox.

In case you want browser specific tests use: `./node_modules/.bin/nightwatch --config nightwatch.conf.js --env chrome` or switch chrome with firefox.

Adding new tests:
1. Copy any of the existing tests
2. First test cases should be essentially the same, login, checkups, ...
3. Add your test cases in between the checkups and the `browser.end()`

Add your test to `diff.sh`:
`diff.sh` compares the PR Branch with the Master Branch and then adds the tests in case any files where changed for which a test exists.
  
## How to name your branch  
  
1. Take the Ticket Number from JIRA (ticketsystem.schul-cloud.org), e.g. SC-999  
2. Name the branch beginning with Ticket Number , e.g. `SC-999-fantasy-problem`
3. Create a PR containing the Ticket Number (Add the `WIP` label if it is still in progress)
  
## Commiting  
  
Default branch: master  
  
1. Go into project folder  
2. Run the tests (see above)  
3. Commit with a meanigful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"  
4. Checkout to master branch  
5. Run `git pull`  
6. Checkout to the branch you want to upload  
7. run `git rebase -p develop` (not `git merge`!) and solve merge conflicts if needed  
8. run `git push`
