const winston = require('winston');
const { Configuration } = require('@schul-cloud/commons');
const isProductionMode = process.env.NODE_ENV === 'production';

let logLevel = Configuration.get('LOG_LEVEL');

let format;

if (!isProductionMode) {
	format = winston.format.combine(
		winston.format.colorize(),
		winston.format.simple(),
	);
} else {
	format = winston.format.simple();
}


const logger = winston.createLogger({
	level: logLevel,
	transports: [
		new winston.transports.Console({
			level: logLevel,
			format,
		}),
	],
});

module.exports = logger;
