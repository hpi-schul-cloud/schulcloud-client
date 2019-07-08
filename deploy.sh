#! /bin/bash

#export TESTDEPLOY=$( cat testdeploy )

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
  # build container brb theme
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
 # docker build -t schulcloud/schulcloud-client:$DOCKERTAG -t schulcloud/schulcloud-client:$GIT_SHA .

  # take those images and push them up to docker hub
 # docker push schulcloud/schulcloud-client:$DOCKERTAG
 # docker push schulcloud/schulcloud-client:$GIT_SHA

  # screw together config file for docker swarm 
 # eval "echo \"$( cat compose-client-test.dummy )\"" > docker-compose-client.yml

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa
#  scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-client.yml linux@test.schul-cloud.org:~
#  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-client.yml test-schul-cloud
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:develop test-schul-cloud_client
}

function deploytoprods {
  chmod 600 travis_rsa
  # open
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client-open:latest open_client
  # brabu
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client-brb:latest brabu_client
  # thueringen
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@schulcloud-thueringen.de /usr/bin/docker service update --force --image schulcloud/schulcloud-client:latest thueringen_client
  # demo
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@demo.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:latest demo_client
}

function deploytostaging {
  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@staging.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:$DOCKERTAG  staging_client
}


openssl aes-256-cbc -K $encrypted_839866e404c6_key -iv $encrypted_839866e404c6_iv -in travis_rsa.enc -out travis_rsa -d

if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  buildandpush
  deploytoprods
elif [ "$TRAVIS_BRANCH" = "develop" ]
then
  buildandpush
  deploytotest
elif [[ $TRAVIS_BRANCH = release* || $TRAVIS_BRANCH = hotfix* ]]
then
  buildandpush
  deploytostaging
else
  echo "Nix wird deployt"
fi

exit 0
