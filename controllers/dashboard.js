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
    }).then(data => data.data.map(assignment => {
        if (assignment.courseId != null) {
            if (!assignment.private) {
                assignment.userIds = assignment.courseId.userIds;
            }
            assignment.color = (assignment.courseId.color.length != 7) ? "#1DE9B6" : assignment.courseId.color;
        } else {
            assignment.color = "#1DE9B6";
            assignment.private = true;
        }
        assignment.url = '/homework/' + assignment._id;
        return assignment;
    }));

    function sortFunction(a, b) {
        if (a.displayAt === b.displayAt) {
            return 0;
        }
        else {
            return (a.displayAt < b.displayAt) ? 1 : -1;
        }
    }
    //Somehow $lte doesn't work in normal query so I manually put it into a request
    const newsPromise = api(req).get('/news?schoolId=' + res.locals.currentSchool + '&displayAt[$lte]=' + new Date().getTime()
    ).then(news => news.data.map(news => {
            news.url = '/news/' + news._id;
            news.timeString = moment(news.displayAt).fromNow();
            return news;
    }).sort(sortFunction).slice(0,3));

    Promise.all([
        eventsPromise,
        homeworksPromise,
        newsPromise
    ]).then(([events, homeworks, news]) => {
        res.render('dashboard/dashboard', {
            title: 'Übersicht',
            events,
            eventsDate: moment().format('dddd, DD. MMMM YYYY'),
            homeworks: _.chunk(homeworks, 3),
            news,
            hours,
            currentTimePercentage,
            currentTime: moment(currentTime).format('kk:mm')
        });
    });
});


module.exports = router;
