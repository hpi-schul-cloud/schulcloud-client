const moment = require('moment');
const api = require('../api');

/**
 * Generates the iso-weekday abbreviation for a given number, e.g. for the Schul-Cloud Calendar-Service
 * @param weekdayNum {number}
 * @returns {string} - abbreviation of weekday
 */
const getIsoWeekdayForNumber = (weekdayNum) => {
    let weekdayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    return weekdayNames[weekdayNum];
};

/**
 * Generates the fullcalendar.js weekday index of a given iso weekday label
 * @param weekday {string}
 * @returns {number} - number of weekday
 */
const getNumberForFullCalendarWeekday = (weekday) => {
    let weekdayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return weekdayNames.indexOf(weekday);
};

/**
 *  Generates the german weekday label for a given number
 * @param weekdayNum {number}
 * @returns {string} - abbreviation of weekday
 */
const getWeekdayForNumber = (weekdayNum) => {
    let weekdayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    return weekdayNames[weekdayNum];
};

/**
 * Generates the index of a given german weekday label
 * @param weekday {string}
 * @returns {number} - number of weekday
 */
const getNumberForWeekday = (weekday) => {
    let weekdayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    return weekdayNames.indexOf(weekday);
};

/**
 * Creates recurring (weekly) events for a @param recurringEvent definition
 * @param recurringEvent {Event} - the recurring (weekly) event
 * @return recurringEvents [] - new set of events
 */
const createRecurringEvents = (recurringEvent) => {
    let recurringEvents = [];
    let start = recurringEvent.start;
    let until = new Date(recurringEvent.included[0].attributes.until).getTime();
    let end = recurringEvent.end;
    let oneDayIndicator = 24 * 60 * 60 * 1000;
    let oneWeekIndicator = 7 * oneDayIndicator;

    // find first weekday, if the start-event is not a real weekly event itself, because it's just a period of time
    for (var i = 0; start + i * oneDayIndicator <= end + oneWeekIndicator; i++) {
        let newStartDate = start + i * oneDayIndicator;
        let newEndDate = end + i * oneDayIndicator;

        // check if it is the given weekday, if so set first date of recurring events
        if (moment(newStartDate).day() == getNumberForFullCalendarWeekday(recurringEvent.included[0].attributes.wkst)) {
            start = newStartDate;
            end = newEndDate;
            break;
        }
    }

    // loop over all new weekdays from startDate to untilDate
    for (i = 0; start + i * oneWeekIndicator <= until; i++) {

        let newStartDate = start + i * oneWeekIndicator;
        let newEndDate = end + i * oneWeekIndicator;

        recurringEvents.push({
            title: recurringEvent.summary,
            summary: recurringEvent.summary,
            location: recurringEvent.location,
            description: recurringEvent.description,
            url: recurringEvent.url,
            color: recurringEvent.color,
            start: newStartDate,
            end: newEndDate
        });

    } 

    return recurringEvents;
};

/**
 * handle recurring events for calendar
 * @param event {Event} - a event which could contain a recurring value
 * @returns events [] - new set of events
 */
const mapRecurringEvent = (event) => {
    if (event.included && event.included[0].attributes.freq == 'WEEKLY') {
        return createRecurringEvents(event);
    }

    return [event];
};

/**
 * maps properties of a event to fit calendar, e.g. url and color
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


module.exports = {
    getIsoWeekdayForNumber,
    getWeekdayForNumber,
    getNumberForWeekday,
    getNumberForFullCalendarWeekday,
    createRecurringEvents,
    mapRecurringEvent,
    mapEventProps
};
