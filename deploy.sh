#! /bin/bash

# automatically rolls out new versions on brandenburg, demo, open and test
# develop-Branch goes to test, Master-Branch goes to productive systems

# export TESTDEPLOY=$( cat testdeploy )

if [ "$TRAVIS_BRANCH" = "master" ]
then
  export DOCKERTAG=latest
else
  # replace special characters in branch name for docker tag
  export DOCKERTAG=$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]" )
fi


function buildandpush {
  # build container default theme
  docker build -t schulcloud/schulcloud-client:$DOCKERTAG -t schulcloud/schulcloud-client:$GIT_SHA .
  # build container n21 theme
  docker build -t schulcloud/schulcloud-client-n21:$DOCKERTAG -t schulcloud/schulcloud-client-n21:$GIT_SHA -f Dockerfile.n21 .
  # build container open theme
  docker build -t schulcloud/schulcloud-client-open:$DOCKERTAG -t schulcloud/schulcloud-client-open:$GIT_SHA -f Dockerfile.open .
  # build Container brandenburg theme
  docker build -t schulcloud/schulcloud-client-brb:$DOCKERTAG -t schulcloud/schulcloud-client-brb:$GIT_SHA -f Dockerfile.brb .

  # Log in to the docker CLI
  echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

  # take those images and push them up to docker hub
  docker push schulcloud/schulcloud-client:$DOCKERTAG
  docker push schulcloud/schulcloud-client:$GIT_SHA
  docker push schulcloud/schulcloud-client-n21:$DOCKERTAG
  docker push schulcloud/schulcloud-client-n21:$GIT_SHA
  docker push schulcloud/schulcloud-client-open:$DOCKERTAG
  docker push schulcloud/schulcloud-client-open:$GIT_SHA
  docker push schulcloud/schulcloud-client-brb:$DOCKERTAG
  docker push schulcloud/schulcloud-client-brb:$GIT_SHA
}

function deploytotest {
  # build container default theme
  docker build -t schulcloud/schulcloud-client:$DOCKERTAG -t schulcloud/schulcloud-client:$GIT_SHA .

  # take those images and push them up to docker hub
  docker push schulcloud/schulcloud-client:$DOCKERTAG
  docker push schulcloud/schulcloud-client:$GIT_SHA

  # screw together config file for docker swarm 
  eval "echo \"$( cat compose-client-test.dummy )\"" > docker-compose-client.yml

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa
  #scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-client.yml linux@test.schul-cloud.org:~
  #ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-client.yml test-schul-cloud
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:latest test-schul-cloud_client
}

function deploytoprods {
  # Deploys new masters on the instances brandenburg, open, demo
  # compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa

  # brandenburg
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client-brb:latest brabu_client
  # open
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client-open:latest open_client
  # demo
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@demo.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:latest demo_client
}


if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  buildandpush
  deploytoprods
elif [[ "$TRAVIS_BRANCH" = "develop" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  deploytotest
else
  echo "Nix wird deployt"
fi

exit 0
