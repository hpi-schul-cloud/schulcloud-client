#!/bin/bash
read -r -d '' CHANGED_FILES << EOM
$(git diff --name-only origin/master)
EOM
for i in $CHANGED_FILES; do
	if [[ $i =~ "views/homework" ]];
	then
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.remote.json --test test/nightwatch/homework/homework_create.js --env ie11,safari,ffox,default" >> frontend_test.sh
	elif [[ $i =~ "views/courses" ]];
	then
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.remote.json --test test/nightwatch/courses/courses_create.js --env ie11,safari,ffox,default" >> frontend_test.sh
	elif [[ $i =~ "views/news" ]];
	then
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.remote.json --test test/nightwatch/news/news_create.js --env ie11,safari,ffox,default" >> frontend_test.sh
	elif [[ $i =~ "views/authentication" ]];
	then
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.remote.json --test test/nightwatch/login/login_demo_lehrer.js --env ie11,safari,ffox,default" >> frontend_test.sh
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.remote.json --test test/nightwatch/login/login_demo_schueler.js --env ie11,safari,ffox,default" >> frontend_test.sh
		echo "./node_modules/.bin/nightwatch -c nightwatch.conf.remote.json --test test/nightwatch/login/login_schueler.js --env ie11,safari,ffox,default" >> frontend_test.sh
	fi
done
