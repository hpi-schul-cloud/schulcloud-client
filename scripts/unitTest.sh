#!/bin/bash -e

# use git https at all cost to avoid depdencies getting downloaded via ssh, which will fail
git config --global url."https://github.com/".insteadOf git@github.com:
git config --global url."https://".insteadOf git://
git config --global url."https://".insteadOf ssh://

# authenticate against docker
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# move client into subdirectory
mkdir schulcloud-client
mv ./* ./schulcloud-client # ignore warning...

# Clone other required repositories and try to switch to branch with same name as current one
# If current branch is hotfix, switch to branch master

# Preconditions
_switchBranch(){
	cd $1
	echo "switching branch..."
	git checkout $2 > /dev/null 2>&1 || true
	echo "(new) active branch for $1:"
	git branch | grep \* | cut -d ' ' -f2
	if [ -z "$3" ]
	then
		echo "No docker tag set for ${1}"
		echo $3
	else
		set -a
		export $3=`git rev-parse HEAD`
		printenv | grep $3
	fi
	cd ..
}

switchBranch(){
	_switchBranch "$1" "main" "$2"

	# if branch exists, try to switch to it
	_switchBranch "$1" "$BRANCH_NAME" "$2"
}

fetch(){
	# clone all required repositories and try to switch to branch with same name as current one
	switchBranch "schulcloud-client" "CLIENT_DOCKER_TAG"

	git clone https://github.com/hpi-schul-cloud/schulcloud-server.git schulcloud-server
	switchBranch "schulcloud-server" "SERVER_DOCKER_TAG"

	git clone https://github.com/hpi-schul-cloud/docker-compose.git docker-compose
	switchBranch "docker-compose"
}

before(){
	cd docker-compose
	docker-compose -f compose-files/docker-compose.yml up -d mongodb mongodb-secondary mongodb-arbiter redis rabbit calendar-init
	sleep 10
	docker-compose -f compose-files/docker-compose.yml up -d mongosetup calendar-postgres
	sleep 15
	docker-compose -f compose-files/docker-compose.yml up -d calendar
	sleep 15
	docker-compose -f compose-files/docker-compose.yml up server server-management &
	cd ..

	echo "waiting max 4 minutes for server-management to be available"
		npx wait-on http://localhost:3333/api/docs -t 240000 --httpTimeout 250 --log
		echo "server-management is now online"

	# inject seed data
	curl -X POST localhost:3333/api/management/database/seed

	echo "waiting max 4 minutes for server to be available"
	npx wait-on http://localhost:3030 -t 240000 --httpTimeout 250 --log
	echo "server is now online"

	echo "waiting max 4 minutes for client to be available"
	npx wait-on http://localhost:3100 -t 240000 --httpTimeout 250 --log
	echo "client is now online"
}

main(){
	# Execute
	# client packages are needed for mocha
	cd schulcloud-client
	npm ci
	npm run build
	npm run mocha
}

set -e
echo "FETCH..."
fetch
echo "FETCH DONE"

echo "BEFORE..."
before
echo "BEFORE DONE"

echo "MAIN..."
main $1
echo "MAIN DONE"
set +e
