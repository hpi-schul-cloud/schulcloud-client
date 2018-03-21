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
	if [[ $i =~ "views/homework" && ! $HOMEWORK ]] || [[ $i =~ "controllers/homework.js" && ! $HOMEWORK ]];
	then
	    export HOMEWORK=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/homework/homework_create.js --env chrome,firefox" >> frontend_test.sh
	    echo "Added homework tests"
	elif [[ $i =~ "views/courses" && ! $COURSES ]] || [[ $i =~ "controllers/courses.js" && ! $COURSES ]];
	then
	    export COURSES=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/courses/courses_create.js --env chrome,firefox" >> frontend_test.sh
	    echo "Added courses tests"
	elif [[ $i =~ "views/news" && ! $NEWS ]] || [[ $i =~ "controllers/news.js" && ! $NEWS ]];
	then
	    export NEWS=true
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/news/news_create.js --env chrome,firefox" >> frontend_test.sh
	    echo "Added news tests"
	elif [[ $i =~ "views/authentication" && ! $AUTHENTICATION ]] || [[ $i =~ "controllers/login" && ! $AUTHENTICATION ]];
	then
	    export AUTHENTICATION=true
	    echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/login/login_demo_schueler.js --env chrome,firefox" >> frontend_test.sh
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/login/login_demo_lehrer.js --env chrome,firefox" >> frontend_test.sh
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.js --test test/nightwatch/login/login_schueler.js --env chrome,firefox" >> frontend_test.sh
	    echo "Added login/reachable tests"
	fi
done
