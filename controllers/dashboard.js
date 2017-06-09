/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const moment = require('moment');
moment.locale('de');
const recurringEventsHelper = require('../helpers/recurringEvents');


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
            all: true,
            until: end.toISOString()
        }
    }).then(events => {
        // because the calender service is *§$" and is not
        // returning recurring events for a given time period
        // now we have to load all events from the beginning of time
        // until end of the current day, map recurring events and
        // display only the correct ones.
        // I'm not happy with the solution but don't see any other less
        // crappy way for this without changing the
        // calendar service in it's core.

        return Promise.all(events.map(event => recurringEventsHelper.mapEventProps(event, req))).then(events => {
            events = [].concat.apply([], events.map(recurringEventsHelper.mapRecurringEvent)).filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);

                return eventStart < end && eventEnd > start;
            });


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
        });
    }).catch(_ => []);

    const homeworksPromise = api(req).get('/homework/', {
        qs: {
            $populate: ['courseId']
        }
    }).then(data => data.data.filter(assignment => {
            if (new Date(assignment.availableDate).getTime() > Date.now()
                && assignment.teacherId != res.locals.currentUser._id) {
                return;
            }
            if (assignment.courseId != null) {
                if (assignment.courseId.userIds.indexOf(res.locals.currentUser._id) == -1
                    && assignment.teacherId != res.locals.currentUser._id) {
                    return;
                }
                if (!assignment.private) {
                    assignment.userIds = assignment.courseId.userIds;
                }
                assignment.color = (assignment.courseId.color.length != 7) ? "#1DE9B6" : assignment.courseId.color;
            } else {
                assignment.color = "#1DE9B6";
                assignment.private = true;
            }
            if (assignment.private
                && assignment.teacherId != res.locals.currentUser._id) {
                return;
            }

            return true;
        }).map(assignment => {
            assignment.url = '/homework/' + assignment._id;
            return assignment;
        }));


    // TODO: Replace with real news service
    const newsPromise = new Promise((resolve, reject) => {
        resolve([{
            name: 'Willkommen im Schuljahr!',
            summary: `Die Schulleitung heißt alle (neuen) Schüler im neuen Schuljahr 
                willkommen. Auch dieses Jahr haben wir wieder viele neue Veranstaltungen für 
                Euch geplant. Unter anderem ein Besuch bei der UNESCO und einen Schüleraustausch 
                mit einer Schule im Silicon Valley der Klasse 10. Viel Erfolg wünscht Euch das 
                Lehrerkolleg!`,
            date: new Date(2017, 4, 29, 10),
            url: ''
        },{
            name: 'Preisverleihung Sommerfestspiele',
            summary: `Auch in diesem Jahr gab es wieder herausragende sportliche
                Leistungen. Unter Anderem ein neuer Schulrekord im 100m-Lauf bei den Mädchen und
                beim Weitsprung der Jungen. Auch für die Versorgung mit Wasser und Energieriegel
                wurde durch den Förderverein gesorgt. Die Urkundenübergabe findet am 30. Juli um
                13 Uhr in der Sporthalle statt.`,
            date: new Date(2017, 4, 25, 10),
            url: ''
        },{
            name: 'Einführung der Schul-Cloud',
            summary: `Um auch nächsten Jahrzehnt des 21. Jahrhunderts bildungsmäßig
                spitze aufgestellt zu sein, nutzen wir ab sofort die Schul-Cloud. Diese
                ermöglicht es unter Anderem, sich mit den bestehenden Moodle-Accounts
                anzumelden, Office zu nutzen und auf Bildungsangebote zuzugreifen. Ebenfalls ist
                es möglich, aktualisierte Stundenpläne und Aufgaben einzusehen.`,
            date: new Date(2017, 4, 20, 10),
            url: ''
        }]);
    });



    Promise.all([
        eventsPromise,
        homeworksPromise,
        newsPromise
    ]).then(([events, homeworks, news]) => {

        homeworks.sort((a,b) => {
            if(a.dueDate > b.dueDate) {
                return 1;
            } else {
                return -1;
            }
        })

        res.render('dashboard/dashboard', {
            title: 'Übersicht',
            events,
            eventsDate: moment().format('dddd, DD. MMMM YYYY'),
            homeworks: _.chunk(homeworks.filter(function(task){return !task.private;}).slice(0, 6), 3),
            myhomeworks: _.chunk(homeworks.filter(function(task){return task.private;}).slice(0, 6), 3),
            news,
            hours,
            currentTimePercentage,
            currentTime: moment(currentTime).format('kk:mm')
        });
    });
});


module.exports = router;
