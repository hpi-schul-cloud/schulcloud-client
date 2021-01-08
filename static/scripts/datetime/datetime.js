import moment from 'moment-timezone';
import getCookie from '../helpers/cookieManager';

const FORMAT = {
	date: 'DD.MM.YYYY',
	dateTime: 'DD.MM.YYYY HH:mm',
};

const getTranslatedFormat = (key) => {
	const translationKey = `format.${key}`;
	const result = $t(translationKey);
	if (result === translationKey) {
		// translations not initialized yet
		return FORMAT[key];
	} return result;
};

const DATETIME_FORMAT = {
	date: () => getTranslatedFormat('date'),
	dateTime: () => getTranslatedFormat('dateTime'),
};

const calendarTimezone = document.querySelector('html').getAttribute('timezone');
const userTimezone = getCookie('USER_TIMEZONE');

const userHasSchoolTimezone = calendarTimezone === userTimezone;

moment.tz.setDefault(calendarTimezone);

const getUtcOffset = () => moment().format('Z');

const now = () => moment();

const toMoment = (date) => (date ? moment(date) : now());

const dateTimeStringToMoment = (date, format = DATETIME_FORMAT.dateTime()) => moment(date, format);

const addStringOffset = (showOffset) => (showOffset && !userHasSchoolTimezone ? `(UTC${getUtcOffset()})` : '');

// eslint-disable-next-line max-len
const toDateTimeString = (date, showOffset = false, format = DATETIME_FORMAT.dateTime()) => `${toMoment(date).format(format)}${addStringOffset(showOffset)}`;

const fromNow = (date) => toMoment(date).fromNow();

const inputRange = ({
	from, toOffset = 0, toOffsetBase = 'y', format = DATETIME_FORMAT.dateTime(),
}) => {
	const startDate = toMoment(from).startOf('hour').add(1, 'hour');
	const endDate = startDate.clone().add(toOffset, toOffsetBase);
	return [
		startDate.format(format),
		endDate.format(format),
	];
};

/**
 * Compares two string as date, if startDate is older returns true
 * @param {String} startDate - The first date string (MM/DD/YYYY or DD/MM/YYYY) to compare with
 * @param {String} endDate - The second date string (MM/DD/YYYY or DD/MM/YYYY) to compare with
 * @returns {boolean}
 */
const compareTwoDates = (startDate = '01.01.2001', endDate = '01.01.2001') => {
    let firstDate = startDate;
    let lastDate = endDate;
    const lang = getCookie('USER_LANG');

    if (lang === 'en') {
        firstDate = moment(firstDate, 'MM/DD/YYYY').format(FORMAT.date);
        lastDate = moment(endDate, 'MM/DD/YYYY').format(FORMAT.date);
    }

    if (moment(firstDate, FORMAT.date) > moment(lastDate, FORMAT.date)) return false;

    return true;
};

export {
	dateTimeStringToMoment,
	fromNow,
	inputRange,
	now,
	toDateTimeString,
	toMoment,
	compareTwoDates,
};
