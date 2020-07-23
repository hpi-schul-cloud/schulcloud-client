#! /bin/bash

set -e
trap 'catch $? $LINENO' EXIT
catch() {
  echo "kabummm!!!"
  if [ "$1" != "0" ]; then
    echo "War wohl nicht so gut. Fehler $1, guckst du $2"
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
  chmod 600 travis_rsa
#  scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-client.yml linux@test.schul-cloud.org:~
#  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-client.yml test-schul-cloud
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:$DOCKERTAG test-schul-cloud_client
}

function deploytoprods {
  chmod 600 travis_rsa
  # open
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client-open:latest open_client
  # brabu
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client-brb:latest brabu_client
  # thueringen
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@schulcloud-thueringen.de /usr/bin/docker service update --force --image schulcloud/schulcloud-client-thr:latest thueringen_client
  # demo
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@demo.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:latest demo_client
}

function deploytostaging {
  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@staging.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-client:$DOCKERTAG  staging_client
}

function deploytohotfix {
  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@hotfix$1.schul-cloud.dev /usr/bin/docker service update --force --image schulcloud/schulcloud-client:$DOCKERTAG hotfix$1_client

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

openssl aes-256-cbc -K $encrypted_839866e404c6_key -iv $encrypted_839866e404c6_iv -in travis_rsa.enc -out travis_rsa -d


if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  inform
elif [ "$TRAVIS_BRANCH" = "develop" ]
then
  deploytotest
elif [[ $TRAVIS_BRANCH = release* ]]
then
  deploytostaging
  inform_staging
elif [[ $TRAVIS_BRANCH = hotfix* ]]
then
	TEAM="$(cut -d'/' -f2 <<< $TRAVIS_BRANCH)"
	if [[ "$TEAM" -gt 0 && "$TEAM" -lt 8 ]]; then
		deploytohotfix $TEAM
		inform_hotfix $TEAM
	else
		echo "Hotfix branch name do not match requirements to deploy"
	fi

else
  echo "Nix wird deployt"
fi

exit 0
