
const moment = require('moment-timezone');
const logger = require('./logger');

let defaultTimezone;

/**
 * @return {String} UTC offest as string based on current timezone, e.g +01:00
 */
const getUtcOffset = () => moment().format('Z');

/**
 * @param {String} timezone Timezone as a string
 */
const setDefaultTimezone = (timezone = null) => {
	const userTimezone = moment.tz.guess();
	if (timezone && timezone !== userTimezone) {
		moment.tz.setDefault(timezone);
		defaultTimezone = timezone;
	} else {
		moment.tz.setDefault();
		defaultTimezone = undefined;
	}
	logger.info(`timesHelper: timezone of the instance is ${defaultTimezone} (${getUtcOffset()})`);
};

const getUserTimezone = () => {
	return defaultTimezone ? defaultTimezone : moment.tz.guess();
}

/**
 * @param {Date} date UTC Date
 * @return {moment} Date object based on current timezone
 */
const fromUTC = (date) => {
	const result = moment(date);
	logger.info(`timesHelper.fromUTC: ${date} to ${result}`);
	return result;
};

/**
 * @return {moment} Current date based on current timezone
 */
const currentDate = () => {
	const result = moment();
	logger.info(`timesHelper.currentDate: ${result}`);
	return result;
};


/**
 * @return {Number} Current time in seconds based on current timezone
 */
const now = () => {
	const result = moment();
	logger.info(`timesHelper.now: ${result}`);
	return result.valueOf();
};

/**
 * Returns changed timezone string, if user browser timezone was changed to a school specific one.
 * @param {boolean} long if long is true the returned string contains long name of the timezone and offset,
 * otherwise just offset
 */
const getChangedTimezoneString = (long = true) => {
	const tzString = long ? `${defaultTimezone} (UTC${getUtcOffset()})` : `(UTC${getUtcOffset()})`;
	return (defaultTimezone ? tzString : '');
};

/**
 * @param {Date} date Date object
 * @return {Object} Timestamp, date and time of given date as object
 */
const splitDate = (date) => {
	const resultDate = moment(date);
	const timezone = getChangedTimezoneString(false);
	return {
		timestamp: resultDate.valueOf(),
		date: resultDate.format('DD.MM.YYYY'),
		time: `${resultDate.format('HH:mm')} ${timezone}`,
	};
};

/**
 * @param {String} dateString String representation of date
 * @param {String} format Format of dateString, e.g. DD.MM.YYYY HH:mm
 * @return {moment} Date object based on current timezone
 */
const createFromString = (dateString, format) => {
	const result = moment(dateString, format);
	logger.info(`timesHelper.createFromString: ${dateString} to ${result}`);
	return result;
};

module.exports = {
	setDefaultTimezone,
	getUserTimezone,
	getChangedTimezoneString,
	getUtcOffset,
	fromUTC,
	currentDate,
	now,
	splitDate,
	createFromString,
};
