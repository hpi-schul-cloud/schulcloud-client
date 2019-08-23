const { parse } = require('./helpers/logic');
const logger = require('../helpers/logger');

// EDIT THIS FILES CONFIGURATION SECTION BELOW ONLY

/**
 * To add config values  to be loaded on startup
 * --> apply a value to the config object using parse()
 *
 * To update a value during running system
 * --> execute setConfig()
 *
 */

/* Config values with defaults */
const config = {
	// CONFIGURATION SECTION STARTS HERE

	/* Config values that have no default */
	LOG_LEVEL: parse(process.env.LOG_LEVEL || 'info', 'logLevel'),
	KEEP_ALIVE: parse(process.env.KEEP_ALIVE || false, 'boolean', 'boolean'),

	/* Environment settings */
	BACKEND_URL: parse(process.env.BACKEND_URL || 'http://localhost:3030/', 'urlstring'),


	/* Theme settings */
	SC_THEME: parse(process.env.THEME || 'default', 'string'),
	SC_TITLE: parse(process.env.SC_TITLE || 'HPI Schul-Cloud', 'string'),
	SHORT_TITLE: parse(process.env.SHORT_TITLE || 'Schul-Cloud', 'string'),
	FEDERALSTATE: parse(process.env.SC_FEDERALSTATE || 'Brandenburg', 'string'),
	DOMAIN: parse(process.env.SC_DOMAIN || 'localhost', 'string'),

	/* Feature Flags */
	SENTRY_DSN: process.env.SENTRY_DSN ? parse(process.env.SENTRY_DSN, 'urlstring') : false,

	// CONFIGURATION SECTION ENDS HERE
};

/**
 * Applies a config value to be updated using some validation and conversion techniques
 * @param {*} name the config value name
 * @param {*} value the config value
 * @param {*} validation validation rule name or array of validation rules
 * @param {*} converter converter to be applied upon sucessful validation on return value
 */
const setConfig = ({
	name, value, validator, converter,
}) => {
	const parsedValue = parse({ value, validator, converter });
	config[name] = parsedValue;
	// todo log config value change
};

module.exports = { setConfig, config };
