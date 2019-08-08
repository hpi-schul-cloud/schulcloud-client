const winston = require('winston');

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

if (!process.env.SECURITY_HEADERS) 	{
	logger.info('SECURITY_HEADERS env has not been defined, to enable'
	+ ' security header set value to 1');
}

const cors = (req, res, next) => {
	if (process.env.SECURITY_HEADERS) {
		res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
		res.setHeader('X-Frame-Options', 'sameorigin');
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-XSS-Protection', '1; mode=block');
		res.setHeader('Referrer-Policy', 'same-origin');
		// eslint-disable-next-line max-len
		res.setHeader('Feature-Policy', 'vibrate \'self\'; speaker *; fullscreen *; sync-xhr *; notifications \'self\'; push \'self\'; geolocation \'self\'; midi \'self\'; microphone \'self\'; camera \'self\'; magnetometer \'self\'; gyroscope \'self\'; payment \'none\';');
	}
	return next();
};

module.exports = cors;
