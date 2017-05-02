/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');

/**
 * Generates the index of a given iso weekday label
 * @param weekday {string}
 * @returns {number} - number of weekday
 */
const getNumberForWeekday = (weekday) => {
    let weekdayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return weekdayNames.indexOf(weekday);
};

/**
 * sets the dow-property for recurring events
 * @param event
 * @returns event
 */
const mapRecurringEvent = (event) => {
    if (event.included) {
        event.dow = event.included[0].attributes.freq == 'WEEKLY' ?  [getNumberForWeekday(event.included[0].attributes.wkst)] : '';
    }
};

/**
 * maps the end and start date of a event to fit fullcalendar
 * @param event
 */
const mapStartEndDate = (event) => {
    event.start = new Date(event.attributes.dtstart).getTime();
    event.end = new Date(event.attributes.dtend).getTime();
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

        events.forEach(mapStartEndDate);
        events.forEach(mapRecurringEvent);
        return res.json(events);
    }).catch(err => {
        console.log(err);
        res.json([]);
    });
});

module.exports = router;
