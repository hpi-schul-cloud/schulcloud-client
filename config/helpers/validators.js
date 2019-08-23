const { URL } = require('url');

const constants = require('./constants');

module.exports = {
	logLevel(value) {
		return constants.loggerLevels.includes(value);
	},
	boolean(value) {
		return value === 'true'
			|| value === 'false'
			|| value === true
			|| value === false;
	},
	urlstring(value) {
		try {
			return this.string(value) && !!new URL(value);
		} catch (_) {
			return false;
		}
	},
	string(value) {
		return typeof value === 'string';
	},
	regExp(value, regExp) {
		return this.string(value) && value.match(regExp);
	},

};
