# Schulcloud Client (Express)
_An implementation of the Schul-Cloud client with NodeJS and Express._

## Requirements

* node.js

## Setup

1. Clone directory into local folder
2. Go into the cloned folder and enter `npm install`
3. Install nodemon by entering `npm install -g nodemon`

## Run

1. Go into project folder
2. run `gulp watch` to run gulp
3. run `npm run watch` to boot the application
4. go to `http://localhost:3100`

## How to name your branch

1. Take the last part of the url of your Trello ticket (e.g. "8-setup-feathers-js")
2. Name the branch after the Trello id (e.g. "8-setup-feathers-js")

## Testing

_Didn't have time to write tests so far :(_

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
