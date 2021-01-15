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

const dateStringToMoment = (date, format = DATETIME_FORMAT.date()) => moment(date, format);

export {
	dateTimeStringToMoment,
	fromNow,
	inputRange,
	now,
	toDateTimeString,
	toMoment,
	dateStringToMoment,
};
