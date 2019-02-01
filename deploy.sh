#! /bin/bash

# build containers
docker build -t schul-cloud/schulcloud-server:$TRAVIS_BRANCH -t schul-cloud/schulcloud-server:$GIT_SHA .

# Log in to the docker CLI
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# take those images and push them up to docker hub
docker push schul-cloud/schulcloud-server:$TRAVIS_BRANCH
docker push schul-cloud/schulcloud-server:$GIT_SHA

# screw together config file for docker swarm 
eval "echo \"$( cat compose-client-test.dummy )\"" > compose-client.yml

# copy config-file to server and execute mit travis_rsa
cp -i travis_rsa compose-client.yml linux@test.schul-cloud.org:~


exit 0
