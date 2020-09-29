
const moment = require('moment-timezone')
const { Configuration } = require('@schul-cloud/commons');
const logger = require('./logger');

const defaultTimezone = Configuration.get('DEFAULT_TIMEZONE');
const fallbackTimezone = 'Europe/Berlin';

const getFallbackTimezone = () => {
	if (defaultTimezone) {
		return defaultTimezone;
	}
	if (process.env.TZ) {
		return process.env.TZ;
	}
	return fallbackTimezone;
};

/**
 * @return {String} UTC offest as string based on current timezone, e.g +01:00
 */
const getUtcOffset = () => {
	return moment().format('Z');
};

/**
 * @param {String} timezone Timezone as a string
 */
const setDefaultTimezone = (timezone = null) => {
	const tz = timezone || getFallbackTimezone();
	if (!tz) {
		throw new Error('No timezone defined');
	}

	moment.tz.setDefault(tz);
	logger.info(`timesHelper: timezone of the instance is ${tz} (${getUtcOffset()})`);
};

/**
 * @param {Date} date UTC Date
 * @return {moment} Date object based on current timezone
 */
const fromUTC = (date) => {
	const result = moment(date);
	logger.info(`timesHelper.fromUTC: ${date} to ${result}`);
	return result;
}

/**
 * @return {moment} Current date based on current timezone
 */
const currentDate = () => {
	const result = moment();
	logger.info(`timesHelper.currentDate: ${result}`);
	return result;
}


/**
 * @return {Number} Current time in seconds based on current timezone
 */
const now = () => {
	const result = moment();
	logger.info(`timesHelper.now: ${result}`);
	return result.valueOf();
}

/**
 * @param {Date} date Date object
 * @return {Object} Timestamp, date and time of given date as object
 */
const splitDate = (date) => {
	const resultDate = moment(date);
	return {
		timestamp: resultDate.valueOf(),
		date: resultDate.format('DD.MM.YYYY'),
		time: resultDate.format('HH:mm'),
	};
}

/**
 * @param {String} dateString String representation of date
 * @param {String} format Format of dateString, e.g. DD.MM.YYYY HH:mm
 * @return {moment} Date object based on current timezone
 */
const createFromString = (dateString, format) => {
	const result = moment(dateString, format);
	logger.info(`timesHelper.createFromString: ${dateString} to ${result}`);
	return result;
}

module.exports = {
	getFallbackTimezone,
	setDefaultTimezone,
	getUtcOffset,
	fromUTC,
	currentDate,
	now,
	splitDate,
	createFromString,
};
