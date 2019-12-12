const util = require('util');
const logger = require('../helpers/logger');

const {
	KEEP_ALIVE = false,
	BACKEND_URL = 'http://localhost:3030/',
	EDITOR_URL = 'http://localhost:4001',
	SENTRY_DSN,
	SC_DOMAIN = 'localhost',
	SC_THEME = 'default',
	REDIS_URI,
} = process.env;

const exp = {
	KEEP_ALIVE,
	BACKEND_URL,
	EDITOR_URL,
	SENTRY_DSN,
	SC_DOMAIN,
	SC_THEME,
	REDIS_URI,
};

logger.info(util.inspect(exp, { depth: 1, compact: false }));

module.exports = exp;
