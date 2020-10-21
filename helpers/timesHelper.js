const moment = require('moment-timezone');
const { Configuration } = require('@schul-cloud/commons');
const logger = require('./logger');

const DEFAULT_TIMEZONE = Configuration.get('I18N__DEFAULT_TIMEZONE');

let schoolTimezone;
let userTimezone;
let userHasSchoolTimezone = true;

let FORMAT = {
	date: 'DD.MM.YYYY',
	dateTime: 'DD.MM.YYYY HH:mm',
	dateLong: 'dddd, DD. MMMM YYYY',
};

/**
 * @return {String} UTC offset as string based on current timezone, e.g +01:00
 */
const getUtcOffset = () => moment().format('Z');

const getUserTimezone = (req) => (((req || {}).cookies || {}).USER_TIMEZONE);

/**
 * Sets date, date time format using locale information
 * @param res
 */
const setDefaultFormats = (res) => {
	if (res && res.$t) {
		FORMAT = {
			date: res.$t('format.date'),
			dateTime: res.$t('format.dateTime'),
			dateLong: res.$t('format.dateLong'),
		};
	}
	return FORMAT;
};

/**
 * Sets default timezone from request (user timezone). If user timezone differs from the school timezone, then
 * school timezone will be set as default
 * @param req
 * @param {String} res result object containing school data debugrmation
 * sets default timezone if school timezone differs from the user timezone
 */
const setDefaultTimezone = (req, res) => {
	schoolTimezone = (res.locals.currentSchoolData || {}).timezone;
	userTimezone = getUserTimezone(req) || res.locals.currentTimezone;
	res.locals.currentTimezone = schoolTimezone || DEFAULT_TIMEZONE;

	moment.tz.setDefault(res.locals.currentTimezone);
	userHasSchoolTimezone = !schoolTimezone || res.locals.currentTimezone === userTimezone;

	res.locals.currentTimezoneOffset = getUtcOffset();
	res.locals.userTimezone = userTimezone;
	res.locals.userHasSchoolTimezone = userHasSchoolTimezone;

	logger.debug(`timesHelper: instance timezone "${res.locals.currentTimezone}
	(${res.locals.currentTimezoneOffset})"`);
	logger.debug(`timesHelper: user timezone "${res.locals.userTimezone}"`);
	logger.debug(`timesHelper: same timezone "${JSON.stringify(res.locals.userHasSchoolTimezone)}"`);
};

/**
 * @param {Date} date UTC Date
 * @return {moment} Date object based on current timezone
 */
const fromUTC = (date) => {
	const result = moment(date);
	logger.debug(`timesHelper.fromUTC: ${date} to ${result.toISOString(true)}`);
	return result;
};

/**
 * @return {moment} Current date based on current timezone
 */
const currentDate = () => {
	const result = moment();
	logger.debug(`timesHelper.currentDate: ${result.toISOString(true)}`);
	return result;
};

/**
 * @return {Number} Current time in seconds based on current timezone
 */
const now = () => {
	const result = moment();
	logger.debug(`timesHelper.now: ${result}`);
	return result.valueOf();
};

/**
 *
 * @param date
 * @returns {string}
 */
const fromNow = (date) => moment(date).fromNow();

/**
 * @param {Date} date Date object
 * @param dateFormat date format
 * @param timeFormat optional time format (default HH:mm)
 * @return {Object} Timestamp, date and time of given date as object
 */
const splitDate = (date, dateFormat = FORMAT.date, timeFormat = 'HH:mm') => {
	const resultDate = moment(date);
	const timezoneOffset = !userHasSchoolTimezone ? `(UTC${getUtcOffset()})` : '';
	return {
		timestamp: resultDate.valueOf(),
		date: resultDate.format(dateFormat),
		time: `${resultDate.format(timeFormat)}${timezoneOffset}`,
	};
};

/**
 * @param {String} dateString String representation of date
 * @param {String} format Format of dateString, e.g. DD.MM.YYYY HH:mm
 * @return {moment} Date object based on current timezone
 */
const createFromString = (dateString, format = FORMAT.dateTime) => {
	const result = moment(dateString, format);
	logger.debug(`timesHelper.createFromString: ${dateString} to ${result.toISOString(true)}`);
	return result;
};

/**
 * Converts dateTimeString to moment object using default date time format {@see FORMAT.dateTime}
 * @param dateTimeString
 * @returns {moment}
 */
const dateTimeStringToMoment = (dateTimeString) => createFromString(dateTimeString, FORMAT.dateTime);

/**
 * Converts dateString to moment object using default date format {@see FORMAT.date}
 * @param dateString
 * @returns {moment}
 */
const dateStringToMoment = (dateString) => createFromString(dateString, FORMAT.date);

/**
 * formats date based on the given format with UTC offset if it was changed to school specific one and is required by
 * the input parameter
 * @param date input date
 * @param format format string
 * @param showTimezoneOffset defines whether to show timezone offset (only if it was changed)
 * @returns {string} formated date string based on input
 */
const formatDate = (date, format = FORMAT.dateTime, showTimezoneOffset = false) => {
	const timezoneOffset = !userHasSchoolTimezone && showTimezoneOffset ? `(UTC${getUtcOffset()})` : '';
	return `${moment(date).format(format)}${timezoneOffset}`;
};

/**
 * Converts date object to date string using default date format {@see FORMAT.date}
 * @param date
 * @returns {string}
 */
const dateToDateString = (date) => formatDate(date, FORMAT.date);

/**
 * Converts date object to dateTime string using default date time format {@see FORMAT.dateTime}
 * @param date
 * @param showTimezone
 * @returns {string}
 */
const dateToDateTimeString = (date, showTimezone) => formatDate(date, FORMAT.dateTime, showTimezone);

/**
 * @param {Date} date Date object
 * @param dateTimeFormat date time format
 * @return {moment} same date and time in different in current timezone (no re-calculation)
 */
const cloneUtcDate = (date, dateTimeFormat = FORMAT.dateTime) => {
	const dateString = moment.utc(date).format(dateTimeFormat);
	const result = createFromString(dateString, dateTimeFormat);
	logger.debug(`timesHelper.cloneDate: ${date} to ${result.toISOString(true)}`);
	return result;
};

/**
 * converts time to string. If time is less than 5 days before now then return fromNow. Otherwise formatDate
 * @param date
 * @param format of the output. Per default date time format is used {@see FORMAT.dateTime}
 * @param showTimezoneOffset
 * @returns {string}
 */
const timeToString = (date, format = FORMAT.dateTime, showTimezoneOffset = true) => {
	const d = moment(date);
	if (d.diff(now()) < 0 || d.diff(now(), 'days') > 5) {
		return formatDate(date, format, showTimezoneOffset);
	}
	return moment(date).fromNow();
};

/**
 * Prints current school timezone
 * @param showTimezoneOffset
 * @returns {string}
 */
const schoolTimezoneToString = (showTimezoneOffset = false) => {
	const offset = showTimezoneOffset ? `(UTC${getUtcOffset()})` : '';
	const schoolTimezoneString = schoolTimezone || '';
	return `${schoolTimezoneString}${offset}`;
};

module.exports = {
	setDefaultTimezone,
	setDefaultFormats,
	getUserTimezone,
	getUtcOffset,
	fromUTC,
	currentDate,
	now,
	fromNow,
	timeToString,
	splitDate,
	formatDate,
	createFromString,
	dateStringToMoment,
	dateTimeStringToMoment,
	dateToDateString,
	dateToDateTimeString,
	cloneUtcDate,
	schoolTimezoneToString,
	moment,
	FORMAT,
};
