const moment = require('moment');
const api = require('../api');
const _ = require('lodash');

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
 * If any error is accoured then return course or team with default color.
 * @param event
 */
const mapEventProps = (event, req) => {
	if (event['x-sc-courseId']) {
		return api(req).get(`/courses/${event['x-sc-courseId']}`).then((course) => {
			event.url = event['x-sc-courseTimeId'] ? `/courses/${course._id}` : '';
			event.color = course.color;
			return event;
		}).catch((err) => {
			// eslint-disable-next-line no-console
			console.log("event['x-sc-courseId']", err);
			event.url = '';
			event.color = '#ff0000';
			return event;
		});
	}

	if (event['x-sc-teamId']) {
		return api(req).get(`/teams/${event['x-sc-teamId']}`).then((team) => {
			event.url = '';
			event.color = team.color;
			return event;
		}).catch((err) => {
			// eslint-disable-next-line no-console
			console.log("event['x-sc-teamId']", err);
			event.url = '';
			event.color = '#ff0000';
			return event;
		});
	}

	return event;
};

/**
 * retrieves the next date for given weekly courseTimes
 * @param courseTimes - the times of a course
 * @return {String} - a formatted date string
 */
const getNextEventForCourseTimes = (courseTimes) => {
	if ((courseTimes || []).length <= 0) return;
	const nextDates = _.map(courseTimes, (ct) => {
		let weekDayIdentifier = ct.weekday + 1; // moment starts on sunday

		// if current week's weekday is over, take the one next week
		if (moment().day() > weekDayIdentifier) weekDayIdentifier += 7;

		// return nothing if date has already passed
		const date = moment().day(weekDayIdentifier).hours(0).minutes(0)
			.seconds(0)
			.milliseconds(ct.startTime);
		if (date.isBefore()) return;

		// has to store index, because .indexOf with moment arrays does not work
		// eslint-disable-next-line consistent-return
		return date;
	});

	// find nearest day from now
	const minDate = _.min(nextDates);
	// eslint-disable-next-line consistent-return
	return moment(minDate).format('DD.MM.YYYY HH:mm');
};

if (!Date.prototype.toLocalISOString) {
    (function() {

        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }

        Date.prototype.toLocalISOString = function() {
            return this.getFullYear() +
                '-' + pad(this.getMonth() + 1) +
                '-' + pad(this.getDate()) +
                'T' + pad(this.getHours()) +
                ':' + pad(this.getMinutes()) +
                ':' + pad(this.getSeconds()) +
                '.' + (this.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                'Z';
        };

    }());
}

module.exports = {
    getIsoWeekdayForNumber,
    getWeekdayForNumber,
    getNumberForWeekday,
    getNumberForFullCalendarWeekday,
    createRecurringEvents,
    mapRecurringEvent,
    mapEventProps,
    getNextEventForCourseTimes
};