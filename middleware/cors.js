const winston = require('winston');
const config = require('config');

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

if (!process.env.CORS) 	{
	logger.info('CORS env has not been defined, to enable route specific CORS'
	+ ' header set value to 1 and update values in config.cors');
}


const corsHeadersForRoute = (path, regexs) => {
	const matchingKeys = Object.keys(regexs)
		.filter(key => path.match(key));
	const corsHeaders = matchingKeys.map(key => regexs[key]);
	logger.debug(`cors headers for route ${path}`, corsHeaders);
	return corsHeaders;
};

const cors = (req, res, next) => {
	if (process.env.CORS) {
		try {
			const corsConfig = config.get('cors');
			const corsAllowOrigins = corsHeadersForRoute(req.path, corsConfig);
			if (corsAllowOrigins.length !== 0) {
				res.setHeader('Access-Control-Allow-Origin', corsAllowOrigins.join(' | '));
			} else {
				logger.debug('do not set cors header, because config does not contain valid content');
			}
		} catch (error) {
			logger.error('error while setting cors header', error);
		}
	}
	return next();
};

module.exports = cors;
