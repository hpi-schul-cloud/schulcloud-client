# HPI Schul-Cloud Client  
_An implementation of the HPI Schul-Cloud client with NodeJS and Express._  

Dev: [![Build Status](https://travis-ci.com/hpi-schul-cloud/schulcloud-client.svg?branch=develop)](https://travis-ci.com/schul-cloud/schulcloud-client)
Master: [![Build Status](https://travis-ci.com/hpi-schul-cloud/schulcloud-client.svg?branch=master)](https://travis-ci.com/schul-cloud/schulcloud-client)

## Powered By

[![Mergify Status](https://gh.mergify.io/badges/hpi-schul-cloud/nuxt-client.png?style=cut)](https://mergify.io)
<a href="https://lokalise.com/" ><img height="18px" src="https://lokalise.com/img/lokalise_logo_black.png" style="padding: 2px 8px; border: 1px solid lightgrey; border-radius: 4px;" alt="Lokalise Logo"></a>

> # Deprecation Warning
> Please note that this client is going to be deprecated.
> All new frontend works is done in Vue.js and can be found here: https://github.com/schul-cloud/nuxt-client

## Requirements  
  
* node.js 12 or later

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
3. Run `gulp watch` to run gulp
4. Set the ENV-variable `TZ=Europe/Berlin` (for windows use `set TZ=Europe/Berlin`). You can also set the variables `SC_TITLE=HPI Schul-Cloud` and `SC_SHORT_TITLE=HPI Schul-Cloud` if you want.
5. run `npm run watch` to boot the application
6. go to `http://localhost:3100`

**Alternative with browser-sync**

1. run `gulp watch-reload` to run gulp with browser sync. It also starts the node-client-server.
2. go to `http://localhost:7000`
  
For connecting to the [SchulCloud Calendar-Service](https://github.com/schul-cloud/schulcloud-calendar) you have to set `export CALENDAR_SERVICE_ENABLED=true`.  
  
For connecting to the [SchulCloud Notification-Service](https://github.com/schul-cloud/node-notification-service) you have to set `export NOTIFICATION_SERVICE_ENABLED=true`.  
   
## Theming  
  
Add Themes to /theme directory. Call gulp and node with SC_THEME set to name of directory.  
then clear build files and gulp cache with `gulp clear`  
  
### Windows  
  run `set SC_THEME={themeName}` without spaces around the equal sign!

## How to name your branch and create a pull request (PR)
  
1. Take the Ticket Number from JIRA (ticketsystem.schul-cloud.org), e.g. SC-999  
2. Name the feature branch beginning with Ticket Number, all words separated by dash "-", e.g. `feature/SC-999-fantasy-problem`
3. Create a PR on branch develop containing the Ticket Number in PR title
4. Keep the `WIP` label as long as this PR is in development, complete PR checklist (is automatically added), keep or increase code test coverage, and pass all tests before you remove the `WIP` label. Reviewers will be added automatically. For more information check our Definition of Done [here](https://docs.schul-cloud.org/pages/viewpage.action?pageId=92831762).

## Testing  
  
**Information**: Please make sure that all your changes works on [Chrome](https://www.google.de/chrome/browser/desktop/index.html) , [Firefox](https://www.mozilla.org/de/firefox/new/) and [Safari](https://www.apple.com/de/safari/)!  
For html/css components please check [caniuse](https://caniuse.com/).  
  
1. Set the password for the demo user `schueler@schul-cloud.org`  
  Ubuntu/Mac: `export SC_DEMO_USER_PASSWORD={PASSWORD}` (Without braces)  
    Windows: `set SC_DEMO_USER_PASSWORD={PASSWORD}` (Without braces)  
2. run `npm run test`  
3. If you want to use another backend url than localhost, set the `BACKEND_URL` and `PUBLIC_BACKEND_URL` environment variables (see 1)  
4. If you want to list the coverage, run `npm run coverage`  

## Commiting

Default branch: develop

1. Go into project folder
2. Checkout to develop branch (or clone for the first time)
3. Run `git pull`
4. Create a branch for your new feature named feature/SC-*Ticket-ID*-*Description*
5. Run the tests (see above)
6. Commit with a meanigful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
7. Start a pull request (see above) to branch develop to merge your changes

## Code rules

[CSP rules](https://github.com/schul-cloud/schulcloud-client/tree/develop/docs/CSP_RULES_DEV.md)
