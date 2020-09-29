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

	fromUTC(dateObj) {
		const result = moment.utc(dateObj).tz(this.timezone);
		logger.info(`timesHelper.fromUTC: ${dateObj} to ${result}`);
		return result;
	}

	createFromString(dateString, format) {
		const result = moment.tz(dateString, format, this.timezone);
		logger.info(`timesHelper.createFromString: ${dateString} to ${result}`);
		return result;
	}

	now() {
		const result = moment.tz(this.timezone);
		logger.info(`timesHelper.now: ${result}`);
		return result;
	}
}

module.exports = { TimesHelper };
