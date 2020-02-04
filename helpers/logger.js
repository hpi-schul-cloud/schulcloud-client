const winston = require('winston');

const isProductionMode = process.env.NODE_ENV === 'production';
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
	transports: [
		new winston.transports.Console({
			format,
		}),
	],
});

module.exports = logger;
