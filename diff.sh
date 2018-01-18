#!/bin/bash
read -r -d '' CHANGED_FILES << EOM
$(git diff --name-only HEAD HEAD~1)
EOM
for i in $CHANGED_FILES; do
	if [[ $i =~ "views/homework" ]];
	then
		echo "./node_modules/.bin/nightwatch --test test/nightwatch/homework/homework_create.js" >> frontend_test.sh
	elif [[ $i =~ "views/courses" ]];
	then
		echo "./node_modules/.bin/nightwatch --test test/nightwatch/courses/courses_create.js" >> frontend_test.sh
	elif [[ $i =~ "views/news" ]];
	then
		echo "./node_modules/.bin/nightwatch --test test/nightwatch/news/news_create.js" >> frontend_test.sh
	elif [[ $i =~ "views/authentication" ]];
	then
		echo "./node_modules/.bin/nightwatch --test test/nightwatch/login/login_demo_lehrer.js" >> frontend_test.sh
		echo "./node_modules/.bin/nightwatch --test test/nightwatch/login/login_demo_schueler.js" >> frontend_test.sh
		echo "./node_modules/.bin/nightwatch --test test/nightwatch/login/login_schueler.js" >> frontend_test.sh
	fi
done
	