const moment = require('moment-timezone')
const { Configuration } = require('@schul-cloud/commons');
const logger = require('./logger');

const defaultTimezone = Configuration.get('DEFAULT_TIMEZONE');

class TimesHelper {
	constructor(timezone = null) {
		this.timezone = timezone;

		if (!this.timezone) {
			this.timezone = defaultTimezone;
		}

		if (!this.timezone) {
			this.timezone = process.env.TZ;
		}

		if (!this.timezone) {
			throw new Error('No timezone defined');
		}
		logger.info(`timesHelper: timezone of the instance is ${this.timezone}`);

	}

	getUtcOffset() {
		return '+/-TBD';
	}

	/**
	 * @param {Date} date UTC Date
	 * @return {Date} Date object based on current timezone
	 */
	fromUTC(date) {
		const result = moment.utc(date).tz(this.timezone).toDate();
		logger.info(`timesHelper.fromUTC: ${date} to ${result}`);
		return result;
	}

	/**
	 * @param {String} dateString String representation of date
	 * @param {String} format Format of dateString, e.g. DD.MM.YYYY HH:mm
	 * @return {Date} Date object based on current timezone
	 */
	createFromString(dateString, format) {
		const result = moment.tz(dateString, format, this.timezone).toDate();
		logger.info(`timesHelper.createFromString: ${dateString} to ${result}`);
		return result;
	}

	/**
	 * @return {Date} Current date based on current timezone
	 */
	currentDate() {
		const result = moment.tz(this.timezone).toDate();
		logger.info(`timesHelper.currentDate: ${result}`);
		return result;
	}

	/**
	 * @return {Number} Current time in seconds based on current timezone
	 */
	now() {
		const result = moment.tz(this.timezone);
		logger.info(`timesHelper.now: ${result}`);
		return result.valueOf();
	}

	/**
	 * @param {Date} date Date object
	 * @return {Object} Timestamp, date and time of given date as object
	 */
	splitDate(date) {
		return {
			timestamp: moment(date).valueOf(),
			date: moment(date).format('DD.MM.YYYY'),
			time: moment(date).format('HH:mm'),
		};
	}
}

module.exports = { TimesHelper };
