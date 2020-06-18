const { Configuration } = require('@schul-cloud/commons');
const { additionalSecurityHeader } = require('../config/http-headers');
const logger = require('../helpers/logger');

if (Configuration.has('SECURITY_HEADERS') !== true) {
	throw new Error('SECURITY_HEADERS missing in Configuration');
}

if (!Configuration.get('SECURITY_HEADERS')) 	{
	logger.info('SECURITY_HEADERS env has not been defined, to enable'
	+ ' security header set value to 1 and update in config/http-headers.js');
}

const cors = (req, res, next) => {
	if (Configuration.get('SECURITY_HEADERS')) {
		Object.keys(additionalSecurityHeader).forEach((header) => {
			res.setHeader(header, additionalSecurityHeader[header]);
		});
	}
	return next();
};

module.exports = cors;
