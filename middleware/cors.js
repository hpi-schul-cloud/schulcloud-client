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


const corsHeadersForRoute = (path, regexs, corsDefault) => {
	let { defaultSrc, scriptSrc, objectSrc } = corsDefault;

	const matchingKeys = Object.keys(regexs)
		.filter(key => path.match(key));
	const corsHeaders = matchingKeys.map(key => regexs[key]);
	corsHeaders.forEach((matchingHeader) => {
		if (matchingHeader.defaultSrc) {
			defaultSrc = `${defaultSrc} ${matchingHeader.defaultSrc}`;
		}
		if (matchingHeader.scriptSrc) {
			scriptSrc = `${scriptSrc} ${matchingHeader.scriptSrc}`;
		}
		if (matchingHeader.objectSrc) {
			objectSrc = `${objectSrc} ${matchingHeader.objectSrc}`;
		}
	});
	const finalCors = { defaultSrc, scriptSrc, objectSrc };
	logger.debug(`cors headers for route ${path}`, finalCors);
	return finalCors;
};

const cors = (req, res, next) => {
	if (process.env.CORS) {
		try {
			const corsDefault = config.get('cors_default');
			const corsConfig = config.get('cors_site_specific');
			const corsAllowContentOrigins = corsHeadersForRoute(req.path, corsConfig, corsDefault);
			if (corsAllowContentOrigins) {
				// eslint-disable-next-line max-len
				res.setHeader('Content-Security-Policy', `default-src ${corsAllowContentOrigins.defaultSrc}; script-src ${corsAllowContentOrigins.scriptSrc}; object-src ${corsAllowContentOrigins.objectSrc};`);
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
