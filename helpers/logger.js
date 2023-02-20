const winston = require('winston');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { NODE_ENV } = require('../config/global');

const { format, transports, createLogger } = winston;

const logLevel = Configuration.get('LOG_LEVEL');
const noColor = Configuration.has('NO_COLOR') && Configuration.get('NO_COLOR');

let formatter;
if (NODE_ENV === 'test') {
	formatter = format.combine(
		format.prettyPrint({ depth: 1, colorize: !noColor }),
	);
} else if (NODE_ENV === 'production') {
	formatter = format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.json(),
	);
} else {
	formatter = format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.prettyPrint({ depth: 3, colorize: !noColor }),
	);
}

const logger = createLogger({
	level: logLevel,
	exitOnError: false,
	transports: [
		new transports.Console({
			level: logLevel,
			format: formatter,
			handleExceptions: true,
			handleRejections: true,
		}),
	],
});

module.exports = logger;
