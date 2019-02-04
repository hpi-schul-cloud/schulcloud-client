#! /bin/bash

# replace special characters in branch name for docker tag
export DOCKERTAG=$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" )

# build containers
docker build -t schulcloud/schulcloud-client:$DOCKERTAG -t schulcloud/schulcloud-client:$GIT_SHA .

# Log in to the docker CLI
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# take those images and push them up to docker hub
docker push schulcloud/schulcloud-client:$DOCKERTAG
docker push schulcloud/schulcloud-client:$GIT_SHA

# screw together config file for docker swarm 
eval "echo \"$( cat compose-client-test.dummy )\"" > docker-compose-client.yml

# copy config-file to server and execute mit travis_rsa
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-client.yml linux@test.schul-cloud.org:~


exit 0
