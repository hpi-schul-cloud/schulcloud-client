#! /bin/bash

git pull
export GIT_SHA=$( git rev-parse HEAD )
docker build -t schulcloud/schulcloud-client:editor -t schulcloud/schulcloud-client:$GIT_SHA .
docker push schulcloud/schulcloud-client:editor
docker push schulcloud/schulcloud-client:$GIT_SHA

exit 0

