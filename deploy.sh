#! /bin/bash

# build containers
docker build -t schul-cloud/schulcloud-server:devel-latest -t schul-cloud/schulcloud-server:devel-$GIT_SHA .
# Log in to the docker CLI
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin
# take those images and push them up to docker hub
docker push schul-cloud/schulcloud-server:devel-latest
docker push schul-cloud/schulcloud-server:devel-$GIT_SHA

exit 0
