const securityHeaderConfig = require('../config/http-headers').additional_security_header;
const logger = require('../helpers/logger');

if (!process.env.SECURITY_HEADERS) 	{
	logger.info('SECURITY_HEADERS env has not been defined, to enable'
	+ ' security header set value to 1 and update in config/http-headers.js');
}

const cors = (req, res, next) => {
	if (process.env.SECURITY_HEADERS) {
		Object.keys(securityHeaderConfig).forEach((header) => {
			res.setHeader(header, securityHeaderConfig[header]);
		});
	}
	return next();
};

module.exports = cors;
