#!/bin/bash
read -r -d '' CHANGED_FILES << EOM
if [[ $TRAVIS_PULL_REQUEST ]]
then
    $(git diff --name-only origin/master)
else
    $(git diff --name-only HEAD HEAD~1)
fi
EOM
for i in $CHANGED_FILES; do
	if [[ $i =~ "views/homework" && ! $HOMEWORK ]];
	then
	    export HOMEWORK=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/homework/" >> frontend_test.sh
	elif [[ $i =~ "views/courses" && ! $COURSES ]];
	then
	    export COURSES=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/courses/" >> frontend_test.sh
	elif [[ $i =~ "views/news" && ! $NEWS ]];
	then
	    export NEWS=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/news/" >> frontend_test.sh
	elif [[ $i =~ "views/authentication" && ! $AUTHENTICATION ]];
	then
	    export AUTHENTICATION=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/login/" >> frontend_test.sh
	fi
done
