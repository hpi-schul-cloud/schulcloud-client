const winston = require('winston');

const isProductionMode = process.env.NODE_ENV === 'production';

let logLevel = process.env.LOG_LEVEL;

if (!logLevel) {
	switch (process.env.NODE_ENV) {
		case 'default':
		case 'development':
			logLevel = 'debug';
			break;
		case 'test':
			logLevel = 'silly';
			break;
		case 'production':
			logLevel = 'warn';
			break;
		default:
			logLevel = 'info';
	}
}

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
