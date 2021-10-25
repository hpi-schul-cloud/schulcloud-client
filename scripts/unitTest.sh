#!/bin/bash -e

# use git https at all cost to avoid depdencies getting downloaded via ssh, which will fail
git config --global url."https://github.com/".insteadOf git@github.com:
git config --global url."https://".insteadOf git://
git config --global url."https://".insteadOf ssh://

# authenticate against docker
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# move client into subdirectory
mkdir schulcloud-client
mv ./* ./schulcloud-client # ignore warning...

# Clone other required repositories and try to switch to branch with same name as current one
# If current branch is hotfix, switch to branch master

# Preconditions
git clone https://github.com/hpi-schul-cloud/schulcloud-server.git schulcloud-server
cd schulcloud-server
if [[ "$BRANCH_NAME" =~ '^hotfix.*' ]]
then
echo "Originating branch hotfix detected. Force testing against Server master."
git checkout master
else
git checkout "$BRANCH_NAME"
fi
echo "Currently active branch for schulcloud-server: $(git branch | grep \* | cut -d ' ' -f2)"
npm ci
npm run build
cd ..

git clone https://github.com/hpi-schul-cloud/docker-compose.git docker-compose
cd docker-compose
if [[ "$BRANCH_NAME" =~ '^hotfix.*' ]]
then
echo "Originating branch hotfix detected. Force testing against Server master."
git checkout master
else
git checkout "$BRANCH_NAME"
fi
echo "Currently active branch for docker-compose: $(git branch | grep \* | cut -d ' ' -f2)"
cd ..

# start rabbitmq
cd docker-compose
docker-compose -f docker-compose.end-to-end-tests-Build.yml build rabbitmq
docker-compose -f docker-compose.end-to-end-tests-Build.yml up -d rabbitmq
cd ..

# start mongodb
cd docker-compose
docker-compose -f docker-compose.end-to-end-tests-Build.yml build server-mongodb
docker-compose -f docker-compose.end-to-end-tests-Build.yml up -d server-mongodb
cd ..

# inject seed data
cd schulcloud-server
npm run setup
cd ..

# start server within of
cd docker-compose
docker-compose -f docker-compose.end-to-end-tests-Build.yml build server
docker-compose -f docker-compose.end-to-end-tests-Build.yml up -d server
cd ..

echo "waiting max 4 minutes for server to be available"
npx wait-on http://localhost:3030 -t 240000 --httpTimeout 250 --log
echo "server is now online"

# Execute
# client packages are needed for mocha
cd schulcloud-client
npm ci
npm run build
npm run mocha
