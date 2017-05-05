/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
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
 * maps jsonapi properties of a event to fit fullcalendar
 * @param event
 */
const mapEventProps = (event) => {
    event.start = new Date(event.attributes.dtstart).getTime();
    event.end = new Date(event.attributes.dtend).getTime();
    event.summary = event.attributes.summary;
    event.title = event.attributes.summary;
    event.location = event.attributes.location;
    event.description = event.attributes.description;
    // todo: maybe refactor later if also class-sites exists
    event.url = event.attributes["x-sc-courseId"] ? `/courses/${event.attributes["x-sc-courseId"]}` : '';
};

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.get('/', function (req, res, next) {
    res.render('calendar/calendar', {
        title: 'Kalender'
    });
});

router.get('/events/', function (req, res, next) {
    api(req).get('/calendar/').then(events => {

        events.forEach(mapEventProps);
        events = [].concat.apply([], events.map(mapRecurringEvent));

        return res.json(events);
    }).catch(err => {
        res.json([]);
    });
});

module.exports = router;
