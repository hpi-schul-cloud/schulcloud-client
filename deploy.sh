#! /bin/bash

#
# set -e : "... Exit immediately if a pipeline [...], which may consist of a single simple command [...],
# a list [...], or a compound command [...] returns a non-zero status. ..."
# [From: https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html]
#
# trap [action] [signal] : Trap calls catch on every EXIT with:
# - status code = 0: Successful run
# - status code != 0: Error
#
set -e
trap 'catch $? $LINENO' EXIT
catch() {
  if [ "$1" != "0" ]; then
    echo "An issue occured in line $2. Status code: $1"
  fi
}

if [ "$TRAVIS_BRANCH" = "master" ]
then
  #export DOCKERTAG=latest
  export DOCKERTAG="master_v$( jq -r '.version' package.json )_$TRAVIS_COMMIT"
else
  # replace special characters in branch name for docker tag
  export DOCKERTAG="$( echo $TRAVIS_BRANCH | tr -s '[:punct:]' '-' | tr -s '[:upper:]' '[:lower:]' )_v$( jq -r '.version' package.json )_$TRAVIS_COMMIT"
fi
echo "DOCKERTAG: $DOCKERTAG"

function deploytotest {
  # build container default theme
 # docker build -t schulcloud/schulcloud-client:$DOCKERTAG -t schulcloud/schulcloud-client:$GIT_SHA .

  # take those images and push them up to docker hub
 # docker push schulcloud/schulcloud-client:$DOCKERTAG
 # docker push schulcloud/schulcloud-client:$GIT_SHA

  # screw together config file for docker swarm
 # eval "echo \"$( cat compose-client-test.dummy )\"" > docker-compose-client.yml

  # copy config-file to server and execute mit travis_rsa
  chmod 600 .build/travis_rsa
#  scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-client.yml linux@test.schul-cloud.org:~
#  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-client.yml test-schul-cloud
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@test.schul-cloud.org schulcloud/schulcloud-client:$DOCKERTAG test-schul-cloud_client
}

function deploytoprods {
  chmod 600 .build/travis_rsa
  # open
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@open.schul-cloud.org schulcloud/schulcloud-client-open:latest open_client
  # brabu
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@open.schul-cloud.org schulcloud/schulcloud-client-brb:latest brabu_client
  # thueringen
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@schulcloud-thueringen.de schulcloud/schulcloud-client-thr:latest thueringen_client
  # demo
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@demo.schul-cloud.org schulcloud/schulcloud-client:latest demo_client
}

function deploytostaging {
  # copy config-file to server and execute mit travis_rsa
  chmod 600 .build/travis_rsa
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@staging.schul-cloud.org schulcloud/schulcloud-client:$DOCKERTAG  staging_client
}

function deploytohotfix {
  # copy config-file to server and execute mit travis_rsa
  chmod 600 .build/travis_rsa
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@hotfix$1.schul-cloud.dev schulcloud/schulcloud-client:$DOCKERTAG hotfix$1_client

}

function inform {
  if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
  then
  curl -X POST -H 'Content-Type: application/json' --data '{"text":":rocket: Die Produktivsysteme können aktualisiert werden: HPI Schul-Cloud Client! Dockertag: '$DOCKERTAG'"}' $WEBHOOK_URL_CHAT
  fi
}


function inform_staging {
  if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
  then
    curl -X POST -H 'Content-Type: application/json' --data '{"text":":boom: Das Staging-System wurde aktualisiert: HPI Schul-Cloud Client! https://staging.schul-cloud.org/version (Dockertag: '$DOCKERTAG')"}' $WEBHOOK_URL_CHAT
  fi
}

function inform_hotfix {
  if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
  then
    curl -X POST -H 'Content-Type: application/json' --data '{"text":":boom: Das Hotfix-'$1'-System wurde aktualisiert: HPI Schul-Cloud Server! https://hotfix'$1'.schul-cloud.org/version (Dockertag: '$DOCKERTAG')"}' $WEBHOOK_URL_CHAT
  fi
}

mkdir .build
openssl aes-256-cbc -K $encrypted_bce910623bb2_key -iv $encrypted_bce910623bb2_iv -in travis_rsa.enc -out .build/travis_rsa -d

if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  # If an event occurs on branch master make sure it's
  # no pull request and call inform. Discard if event
  # is related to a pull request.
  echo "Event detected on branch master. Event is no Pull Request. Informing team."
  inform
elif [ "$TRAVIS_BRANCH" = "develop" ]
then
  # If an event occurs on branch develop deploy to test
  echo "Event detected on branch develop. Attempting to deploy to development (test) environment..."
  deploytotest
elif [[ $TRAVIS_BRANCH = release* ]]
then
  # If an event occurs on branch release* deploy to staging
  echo "Event detected on branch release*. Attempting to deploy to staging environment..."
  deploytostaging
  inform_staging
elif [[ $TRAVIS_BRANCH = hotfix* ]]
then
  # If an event occurs on branch hotfix* parse team id
  # and deploy to according hotfix environment
  TEAM="$(cut -d'/' -f2 <<< $TRAVIS_BRANCH)"
  if [[ "$TEAM" -gt 0 && "$TEAM" -lt 8 ]]; then
    echo "Event detected on branch hotfix/$TEAM/... . Attempting to deploy to hotfix environment $TEAM..."
    deploytohotfix $TEAM
    inform_hotfix $TEAM
  else
    echo "Event detected on branch hotfix*. However, branch name pattern does not match requirements to deploy. Expected hotfix/<team_number>/XX.XX.XX but got $TRAVIS_BRANCH"
  fi
else
  # If no condition is met, nothing will be deployed.
  echo "Event detected which does not meet any conditions. Deployment will be skipped."
fi

rm -rf .build
exit 0
