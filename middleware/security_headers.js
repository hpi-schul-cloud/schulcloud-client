const { additionalSecurityHeader } = require('../config/http-headers');
const logger = require('../helpers/logger');

if (!process.env.SECURITY_HEADERS) 	{
	logger.info('SECURITY_HEADERS env has not been defined, to enable'
	+ ' security header set value to 1 and update in config/http-headers.js');
}

const cors = (req, res, next) => {
	if (process.env.SECURITY_HEADERS) {
		Object.keys(additionalSecurityHeader).forEach((header) => {
			res.setHeader(header, additionalSecurityHeader[header]);
		});
	}
	return next();
};

module.exports = cors;
