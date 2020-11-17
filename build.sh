#! /bin/bash

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
elif [[ "$TRAVIS_BRANCH" = feature* ]]
then
	# extract JIRA_TICKET_ID from TRAVIS_BRANCH
	JIRA_TICKET_ID=${TRAVIS_BRANCH/#feature\//}
	JIRA_TICKET_TEAM=${JIRA_TICKET_ID/%-*/}
	JIRA_TICKET_ID=${JIRA_TICKET_ID/#$JIRA_TICKET_TEAM"-"/}
	JIRA_TICKET_ID=${JIRA_TICKET_ID/%-*/}
	JIRA_TICKET_ID=$JIRA_TICKET_TEAM"-"$JIRA_TICKET_ID	
	# export DOCKERTAG=naming convention feature-<Jira id>-latest
	export DOCKERTAG=$( echo "feature-"$JIRA_TICKET_ID"-latest")
else
  # replace special characters in branch name for docker tag
  export DOCKERTAG="$( echo $TRAVIS_BRANCH | tr -s '[:punct:]' '-' | tr -s '[:upper:]' '[:lower:]' )_v$( jq -r '.version' package.json )_$TRAVIS_COMMIT"
fi
echo "DOCKERTAG: $DOCKERTAG"

function buildandpush {
  # build container default theme
  docker build -t schulcloud/schulcloud-client:$DOCKERTAG -t schulcloud/schulcloud-client:$GIT_SHA .

  # Log in to the docker CLI
  echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

  # take those images and push them up to docker hub
  docker push schulcloud/schulcloud-client:$DOCKERTAG
  docker push schulcloud/schulcloud-client:$GIT_SHA

  # 
  # if [[ "$TRAVIS_BRANCH" = "master" || release* && "$TRAVIS_PULL_REQUEST" = "false" ]]
  # 
  # "$TRAVIS_BRANCH" = "master" || release* -> is always true, will be removed.

  if [[ "$TRAVIS_PULL_REQUEST" = "false" || "$TRAVIS_BRANCH" != feature* ]]
  then
    # build container n21 theme
    docker build -t schulcloud/schulcloud-client-n21:$DOCKERTAG -t schulcloud/schulcloud-client-n21:$GIT_SHA -f Dockerfile.n21 .
    docker push schulcloud/schulcloud-client-n21:$DOCKERTAG
    docker push schulcloud/schulcloud-client-n21:$GIT_SHA

    # build container open theme
    docker build -t schulcloud/schulcloud-client-open:$DOCKERTAG -t schulcloud/schulcloud-client-open:$GIT_SHA -f Dockerfile.open .
    docker push schulcloud/schulcloud-client-open:$DOCKERTAG
    docker push schulcloud/schulcloud-client-open:$GIT_SHA

    # build container brb theme
    docker build -t schulcloud/schulcloud-client-brb:$DOCKERTAG -t schulcloud/schulcloud-client-brb:$GIT_SHA -f Dockerfile.brb .
    docker push schulcloud/schulcloud-client-brb:$DOCKERTAG
    docker push schulcloud/schulcloud-client-brb:$GIT_SHA

    # build container thr theme
    docker build -t schulcloud/schulcloud-client-thr:$DOCKERTAG -t schulcloud/schulcloud-client-thr:$GIT_SHA -f Dockerfile.thr .
    docker push schulcloud/schulcloud-client-thr:$DOCKERTAG
    docker push schulcloud/schulcloud-client-thr:$GIT_SHA

    # build container int theme
    docker build -t schulcloud/schulcloud-client-int:$DOCKERTAG -t schulcloud/schulcloud-client-int:$GIT_SHA -f Dockerfile.int .
    docker push schulcloud/schulcloud-client-int:$DOCKERTAG
    docker push schulcloud/schulcloud-client-int:$GIT_SHA

    # build container demo theme
    docker build -t "schulcloud/schulcloud-client-demo:$DOCKERTAG" -t "schulcloud/schulcloud-client-demo:$GIT_SHA" -f Dockerfile.demo .
    docker push "schulcloud/schulcloud-client-demo:$DOCKERTAG"
    docker push "schulcloud/schulcloud-client-demo:$GIT_SHA"
  fi

  # If branch is develop, add and push additional docker tags
  if [[ "$TRAVIS_BRANCH" = "develop" ]]
  then
    docker tag schulcloud/schulcloud-client:$DOCKERTAG schulcloud/schulcloud-client:develop_latest
    docker push schulcloud/schulcloud-client:develop_latest
  fi

  if [[ "$TRAVIS_BRANCH" = "develop" && "$TRAVIS_PULL_REQUEST" = "false" ]]
  then
    # build container n21 theme
    docker tag schulcloud/schulcloud-client-n21:$DOCKERTAG schulcloud/schulcloud-client-n21:develop_latest
    docker push schulcloud/schulcloud-client-n21:develop_latest

    # build container open theme
    docker tag schulcloud/schulcloud-client-open:$DOCKERTAG schulcloud/schulcloud-client-open:develop_latest
    docker push schulcloud/schulcloud-client-open:develop_latest

    # build container brb theme
    docker tag schulcloud/schulcloud-client-brb:$DOCKERTAG schulcloud/schulcloud-client-brb:develop_latest
    docker push schulcloud/schulcloud-client-brb:develop_latest

    # build container thr theme
    docker tag schulcloud/schulcloud-client-thr:$DOCKERTAG schulcloud/schulcloud-client-thr:develop_latest
    docker push schulcloud/schulcloud-client-thr:develop_latest

    # build container int theme
    docker tag schulcloud/schulcloud-client-int:$DOCKERTAG schulcloud/schulcloud-client-int:develop_latest
    docker push schulcloud/schulcloud-client-int:develop_latest

    # build container demo theme
    docker tag schulcloud/schulcloud-client-demo:$DOCKERTAG schulcloud/schulcloud-client-demo:develop_latest
    docker push schulcloud/schulcloud-client-demo:develop_latest
  fi
}

# write version file
printf "%s\n%s\n%s" $TRAVIS_COMMIT $TRAVIS_BRANCH $TRAVIS_COMMIT_MESSAGE > ./version

if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  buildandpush
elif [ "$TRAVIS_BRANCH" = "develop" ]
then
  buildandpush
elif [[ $TRAVIS_BRANCH = release* || $TRAVIS_BRANCH = hotfix* || $TRAVIS_BRANCH = feature* ]]
then
  buildandpush
else
  echo "no build"
fi

exit 0
