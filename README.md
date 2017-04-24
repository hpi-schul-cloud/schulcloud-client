# Schulcloud Client
_An implementation of the Schul-Cloud client with NodeJS and Express._

Dev: ![Travis Status](https://travis-ci.org/schul-cloud/schulcloud-client.svg?branch=master)<br>
Production: ![Travis Status](https://travis-ci.org/schul-cloud/schulcloud-client.svg?branch=production)

## Requirements

* node.js
sadsa
## Setup

1. Clone directory into local folder
2. Go into the cloned folder and enter `npm install`
3. Install nodemon and gulp globally by entering `npm install -g nodemon gulp`

## Run

1. Start the [schul-cloud server](https://github.com/schulcloud/schulcloud-server)
2. Go into project folder
3. run `gulp watch` to run gulp
4. run `npm run watch` to boot the application
5. go to `http://localhost:3100`

## How to name your branch

1. Take the last part of the url of your Trello ticket (e.g. "8-setup-feathers-js")
2. Name the branch after the Trello id (e.g. "8-setup-feathers-js")

## Testing

1. Set the password for the demo user `schueler@schul-cloud.org`
    Ubuntu/Mac: `export SC_DEMO_USER_PASSWORD={PASSWORD}` (Without braces)
    Windows: `set SC_DEMO_USER_PASSWORD={PASSWORD}` (Without braces)
2. run `npm run test`
3. If you want to use another backend url than localhost, set the `BACKEND_URL` environment variable (see 1)
4. If you want to list the coverage, run `npm run coverage`

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
