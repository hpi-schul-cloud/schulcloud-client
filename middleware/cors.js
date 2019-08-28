const { contentSecurityPolicy, accessControlAllowOrigin } = require('../config/http-headers');
const logger = require('../helpers/logger');

if (!process.env.CORS) 	{
	logger.info('CORS env has not been defined, to enable route specific CORS'
	+ ' header set value to 1 and update values in config.cors');
}


const cspHeadersForRoute = (path, regexs, corsDefault) => {
	let { defaultSrc, scriptSrc, objectSrc } = corsDefault;

	const matchingKeys = Object.keys(regexs)
		.filter(key => path.match(key));
	const corsHeaders = matchingKeys.map(key => regexs[key]);
	corsHeaders.forEach((matchingHeader) => {
		if (matchingHeader.defaultSrc && matchingHeader.defaultSrc.includes('*')) {
			defaultSrc = '*';
		} else if (matchingHeader.defaultSrc) {
			defaultSrc = `${defaultSrc} ${matchingHeader.defaultSrc}`;
		}
		if (matchingHeader.scriptSrc && matchingHeader.scriptSrc.includes('*')) {
			scriptSrc = '*';
		} else if (matchingHeader.scriptSrc) {
			scriptSrc = `${scriptSrc} ${matchingHeader.scriptSrc}`;
		}
		if (matchingHeader.objectSrc && matchingHeader.objectSrc.includes('*')) {
			objectSrc = '*';
		} else if (matchingHeader.objectSrc) {
			objectSrc = `${objectSrc} ${matchingHeader.objectSrc}`;
		}
	});
	const finalCors = { defaultSrc, scriptSrc, objectSrc };
	logger.debug(`cors headers for route ${path}`, finalCors);
	return finalCors;
};

const accessControlHeadersForRoute = (path, regexs) => {
	const matchingKeys = Object.keys(regexs)
		.filter(key => path.match(key));
	const corsHeaders = matchingKeys.map(key => regexs[key]);
	logger.debug(`cors headers for route ${path}`, corsHeaders);
	return corsHeaders;
};

const cors = (req, res, next) => {
	if (process.env.CORS === 'true') {
		try {
			// Content-Security-Policy
			const { corsDefault, corsSiteSpecific } = contentSecurityPolicy;
			const corsAllowContentOrigins = cspHeadersForRoute(req.path, corsSiteSpecific, corsDefault);
			if (corsAllowContentOrigins) {
				// eslint-disable-next-line max-len
				res.setHeader('Content-Security-Policy', `default-src ${corsAllowContentOrigins.defaultSrc}; script-src ${corsAllowContentOrigins.scriptSrc}; object-src ${corsAllowContentOrigins.objectSrc};`);
			} else {
				logger.debug('Content-Security-Policy header not set, because config does not contain valid content');
			}

			// Access-Control-Allow-Origin
			const corsAllowOrigins = accessControlHeadersForRoute(req.path, accessControlAllowOrigin);
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
