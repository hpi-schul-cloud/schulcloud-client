# authenticate against docker
sudo echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin
# move client into subdirectory
mkdir -p schulcloud-client
mv !(schulcloud-client) schulcloud-client

# Clone other required repositories and try to switch to branch with same name as current one
# If current branch is hotfix, switch to branch master

# Preconditions
git clone https://github.com/hpi-schul-cloud/schulcloud-server.git schulcloud-server
cd schulcloud-server
if [[ $TRAVIS_PULL_REQUEST_BRANCH = hotfix* ]]
then
echo "Originating branch hotfix detected. Force testing against Server master."
git checkout master
else
git checkout "$TRAVIS_PULL_REQUEST_BRANCH" || git checkout "$TRAVIS_BRANCH"
fi
echo "Currently active branch for schulcloud-server: $(git branch | grep \* | cut -d ' ' -f2)"
cd ..

git clone https://github.com/hpi-schul-cloud/docker-compose.git docker-compose
cd docker-compose
if [[ $TRAVIS_PULL_REQUEST_BRANCH = hotfix* ]]
then
echo "Originating branch hotfix detected. Force testing against Server master."
git checkout master
else
git checkout "$TRAVIS_PULL_REQUEST_BRANCH" || git checkout "$TRAVIS_BRANCH"
fi
echo "Currently active branch for docker-compose: $(git branch | grep \* | cut -d ' ' -f2)"
cd ..

# boot server
cd docker-compose
docker-compose -f docker-compose.end-to-end-tests-Build.yml build server
docker-compose -f docker-compose.end-to-end-tests-Build.yml up -d server
cd ..

cd schulcloud-server
npm install
npm run setup
npm run seed
cd ..


# Execute
# client packages are needed for mocha
cd schulcloud-client
npm ci
npm run build
npm run mocha


