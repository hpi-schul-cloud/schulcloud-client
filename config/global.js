const util = require('util');
const logger = require('../helpers/logger');

const {
	KEEP_ALIVE = false,
	BACKEND_URL = 'http://localhost:3030/',
	EDITOR_URL = 'http://localhost:4001',
	SENTRY_DSN = false,
	SC_DOMAIN = 'localhost',
	SC_THEME = 'default',
	REDIS_URI,
	REQUEST_TIMEOUT = 15000, // 15 sec
	NODE_ENV = 'development',
	JWT_SHOW_TIMEOUT_WARNING_SECONDS = 3600, // 60 min
	JWT_TIMEOUT_SECONDS,
} = process.env;

const exp = {
	KEEP_ALIVE,
	BACKEND_URL,
	EDITOR_URL,
	SENTRY_DSN,
	SC_DOMAIN,
	SC_THEME,
	REDIS_URI,
	REQUEST_TIMEOUT,
	NODE_ENV,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS,
	JWT_TIMEOUT_SECONDS,
};

logger.info(util.inspect(exp, { depth: 1, compact: false }));

module.exports = exp;
