/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const moment = require('moment');
moment.locale('de');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    // we display time from 8 a.m. to 8 p.m.
    const timeStart = 8;
    const timeEnd = 20;
    const numHours = timeEnd - timeStart;
    const numMinutes = numHours * 60;
    const hours = [];

    for(let j = 0; j < numHours; j++) {
        hours.push(j + timeStart);
    }

    const start = new Date();
    start.setHours(timeStart,0,0,0);
    const end = new Date();
    end.setHours(timeEnd,0,0,0);

    const currentTime = new Date();
    let currentTimePercentage = 100 * (((currentTime.getHours() - timeStart) * 60) + currentTime.getMinutes()) / numMinutes;
    if(currentTimePercentage < 0) currentTimePercentage = 0;
    else if(currentTimePercentage > 100) currentTimePercentage = 100;

    const eventsPromise = api(req).get('/calendar/', {
        qs: {
            from: start.toISOString(),
            until: end.toISOString()
        }
    }).then(events => {
        return (events || []).map(event => {
            const eventStart = new Date(event.start);
            let eventEnd = new Date(event.end);

            // cur events that are too long
            if(eventEnd > end) {
                eventEnd = end;
                event.end = eventEnd.toISOString();
            }

            // subtract timeStart so we can use these values for left alignment
            const eventStartRelativeMinutes = ((eventStart.getHours() - timeStart) * 60) + eventStart.getMinutes();
            const eventEndRelativeMinutes = ((eventEnd.getHours() - timeStart) * 60) + eventEnd.getMinutes();
            const eventDuration = eventEndRelativeMinutes - eventStartRelativeMinutes;

            event.comment = moment(eventStart).format('kk:mm') + ' - ' + moment(eventEnd).format('kk:mm');
            event.style = {
                left: 100 * (eventStartRelativeMinutes / numMinutes),  // percent
                width: 100 * (eventDuration / numMinutes)  // percent
            };

            return event;
        });
    }).catch(_ => []);

    const homeworksPromise = api(req).get('/homework/', {
        qs: {
            $populate: ['courseId']
        }
    }).then(data => data.data.map(h => {
        h.url = '/homework/' + h._id;
        return h;
    }));

    // TODO: Replace with real news service
    const newsPromise = new Promise((resolve, reject) => {
        resolve([{
            name: 'Willkommen im Schuljahr 2016!',
            summary: `Die Schulleitung heißt alle (neuen) Schüler im neuen Schuljahr 
                willkommen. Auch dieses Jahr haben wir wieder viele neue Veranstaltungen für 
                Euch geplant. Unter anderem ein Besuch bei der UNESCO und einen Schüleraustausch 
                mit einer Schule im Silicon Valley der Klasse 10. Viel Erfolg wünscht Euch das 
                Lehrerkolleg!`,
            date: new Date(),
            url: ''
        },{
            name: 'Preisverleihung Sommerfestspiele',
            summary: `Auch in diesem Jahr gab es wieder herausragende sportliche
                Leistungen. Unter Anderem ein neuer Schulrekord im 100m-Lauf bei den Mädchen und
                beim Weitsprung der Jungen. Auch für die Versorgung mit Wasser und Energieriegel
                wurde durch den Förderverein gesorgt. Die Urkundenübergabe findet am 30. Juni um
                13 Uhr in der Sporthalle statt.`,
            date: new Date(),
            url: ''
        },{
            name: 'Einführung der Schul-Cloud',
            summary: `Um auch nächsten Jahrzehnt des 21. Jahrhunderts bildungsmäßig
                spitze aufgestellt zu sein, nutzen wir ab sofort die Schul-Cloud. Diese
                ermöglicht es unter Anderem, sich mit den bestehenden Moodle-Accounts
                anzumelden, Office zu nutzen und auf Bildungsangebote zuzugreifen. Ebenfalls ist
                es möglich, aktualisierte Stundenpläne und Aufgaben einzusehen.`,
            date: new Date(),
            url: ''
        }]);
    });

    Promise.all([
        eventsPromise,
        homeworksPromise,
        newsPromise
    ]).then(([events, homeworks, news]) => {
        res.render('dashboard/dashboard', {
            title: 'Übersicht',
            events,
            homeworks,
            news,
            hours,
            currentTimePercentage,
            currentTime: moment(currentTime).format('kk:mm')
        });
    });
});


module.exports = router;
