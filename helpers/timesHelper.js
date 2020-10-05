const moment = require('moment-timezone');
const logger = require('./logger');

let defaultTimezone;

/**
 * @return {String} UTC offest as string based on current timezone, e.g +01:00
 */
const getUtcOffset = () => moment().format('Z');

/**
 * @param {String} res result object containing shool data information
 * sets default timezone if school timezone differs from the user timezone
 */
const setDefaultTimezone = (res) => {
	const { timezone } = res.locals.currentSchoolData || {};
	const userTimezone = moment.tz.guess();
	if (timezone && timezone !== userTimezone) {
		moment.tz.setDefault(timezone);
		defaultTimezone = timezone;
	} else {
		moment.tz.setDefault();
		defaultTimezone = undefined;
	}
	logger.info(`timesHelper: timezone of the instance is ${defaultTimezone} (${getUtcOffset()})`);
	res.locals.currentTimezone = defaultTimezone;
	res.locals.currentTimezoneOffset = defaultTimezone ? getUtcOffset() : '';
};

const getUserTimezone = () => (defaultTimezone || moment.tz.guess());

/**
 * @param {Date} date UTC Date
 * @return {moment} Date object based on current timezone
 */
const fromUTC = (date) => {
	const result = moment(date);
	logger.info(`timesHelper.fromUTC: ${date} to ${result.toISOString(true)}`);
	return result;
};

/**
 * @return {moment} Current date based on current timezone
 */
const currentDate = () => {
	const result = moment();
	logger.info(`timesHelper.currentDate: ${result.toISOString(true)}`);
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
 * @param {Date} date Date object
 * @return {Object} Timestamp, date and time of given date as object
 */
const splitDate = (date) => {
	const resultDate = moment(date);
	const timezoneOffset = defaultTimezone ? `(UTC${getUtcOffset()})` : '';
	return {
		timestamp: resultDate.valueOf(),
		date: resultDate.format('DD.MM.YYYY'),
		time: `${resultDate.format('HH:mm')}${timezoneOffset}`,
	};
};

/**
 * @param {String} dateString String representation of date
 * @param {String} format Format of dateString, e.g. DD.MM.YYYY HH:mm
 * @return {moment} Date object based on current timezone
 */
const createFromString = (dateString, format) => {
	const result = moment(dateString, format);
	logger.info(`timesHelper.createFromString: ${dateString} to ${result.toISOString(true)}`);
	return result;
};

/**
 * formats date based on the given format with UTC offset if it was changed to school specific one and is required by
 * the input parameter
 * @param date input date
 * @param format format string
 * @param showTimezoneOffset defines whether to show timezone offset (only if it was changed)
 * @returns {string} formated date string based on input
 */
const formatDate = (date, format, showTimezoneOffset = false) => {
	const timezoneOffset = defaultTimezone && showTimezoneOffset ? `(UTC${getUtcOffset()})` : '';
	return `${moment(date).format(format)}${timezoneOffset}`;
};

/**
 * @param {Date} date Date object
 * @return {moment} same date and time in different in current timezone (no re-calculation)
 */
const cloneUtcDate = (date) => {
	const format = 'YYYY-MM-DD HH:mm:ss';
	const dateString = moment.utc(date).format(format);
	const result = createFromString(dateString, format);
	logger.info(`timesHelper.cloneDate: ${date} to ${result.toISOString(true)}`);
	return result;
};

module.exports = {
	setDefaultTimezone,
	getUserTimezone,
	getUtcOffset,
	fromUTC,
	currentDate,
	now,
	splitDate,
	formatDate,
	createFromString,
	cloneUtcDate,
};
