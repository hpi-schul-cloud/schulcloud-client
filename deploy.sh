#! /bin/bash

# build containers
docker build -t schul-cloud/schulcloud-client:$TRAVIS_BRANCH -t schul-cloud/schulcloud-client:$GIT_SHA .

# Log in to the docker CLI
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# take those images and push them up to docker hub
docker push schul-cloud/schulcloud-client:$TRAVIS_BRANCH
docker push schul-cloud/schulcloud-client:$GIT_SHA

# screw together config file for docker swarm 
eval "echo \"$( cat compose-client-test.dummy )\"" > docker-compose-client.yml

# copy config-file to server and execute mit travis_rsa
scp -i travis_rsa docker-compose-client.yml linux@test.schul-cloud.org:~


exit 0
