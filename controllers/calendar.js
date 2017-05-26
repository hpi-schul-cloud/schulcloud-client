/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const moment = require("moment");
const recurringEventsHelper = require('../helpers/recurringEvents');

/**
 * handle recurring events for fullcalendar.js
 * @param event {Event} - a event which could contain a recurring value
 * @returns events [] - new set of events
 */
const mapRecurringEvent = (event) => {
    if (event.included && event.included[0].attributes.freq == 'WEEKLY') {
        return recurringEventsHelper.createRecurringEvents(event);
    }

    return [event];
};

/**
 * maps properties of a event to fit fullcalendar, e.g. url and color
 * @param event
 */
const mapEventProps = (event, req) => {
    if (event["x-sc-courseId"]) {
        return api(req).get('/courses/' + event["x-sc-courseId"]).then(course => {
            event.url = event["x-sc-courseTimeId"] ? '/courses/' + course._id : '';
            event.color = course.color;
            return event;
        });
    }

    return event;
};

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.get('/', function (req, res, next) {
    res.render('calendar/calendar', {
        title: 'Kalender',
        userId: res.locals.currentUser._id
    });
});

router.get('/events/', function (req, res, next) {
    api(req).get('/calendar/', {
        qs: {
            all: true
        }
    }).then(events => {
        Promise.all(events.map(event => mapEventProps(event, req))).then(events => {
            events = [].concat.apply([], events.map(mapRecurringEvent));
            return res.json(events);
        });
    }).catch(err => {
        res.json([]);
    });
});

router.post('/events/', function (req, res, next) {
    req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm').toISOString();
    req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm').toISOString();

    // filter params
    if (req.body.courseId && req.body.courseId !== '') {
        req.body.scopeId = req.body.courseId;
    } else {
        delete req.body.courseId;
    }

   api(req).post('/calendar/', {json: req.body}).then(event => {
      res.redirect('/calendar');
   });
});

router.delete('/events/:eventId', function (req, res, next) {
   api(req).delete('/calendar/' + req.params.eventId).then(_ => {
       res.json(_);
   }).catch(err => {
       next(err);
   });
});

router.put('/events/:eventId', function (req, res, next) {
    req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm').toISOString();
    req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm').toISOString();

    api(req).put('/calendar/' + req.params.eventId, {
        json: req.body
    }).then(_ => {

        res.redirect('/calendar/');
    }).catch(err => {
        next(err);
    });
});

module.exports = router;
