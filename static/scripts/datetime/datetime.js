import moment from 'moment-timezone';
import getCookie from '../helpers/cookieManager';

const DATETIME_FORMAT = {
	date: $t('format.dateToPicker'),
	dateTime: $t('format.dateTimeToPicker'),
};

const calendarTimezone = document.querySelector('html').getAttribute('timezone');
const userTimezone = getCookie('USER_TIMEZONE');

const userHasSchoolTimezone = calendarTimezone === userTimezone;

moment.tz.setDefault(calendarTimezone);

const getUtcOffset = () => moment().format('Z');

const now = () => moment();

const toMoment = (date) => (date ? moment(date) : now());

const dateTimeStringToMoment = (date, format = DATETIME_FORMAT.dateTime) => moment(date, format);

const addStringOffset = (showOffset) => (showOffset && !userHasSchoolTimezone ? `(UTC${getUtcOffset()})` : '');

// eslint-disable-next-line max-len
const toDateTimeString = (date, showOffset = false, format = DATETIME_FORMAT.dateTime) => `${toMoment(date).format(format)}${addStringOffset(showOffset)}`;

const fromNow = (date) => toMoment(date).fromNow();

// eslint-disable-next-line max-len
const inputRangeDate = (offset = 0, offsetBase = 'y', format = DATETIME_FORMAT.dateTime) => toMoment().add(offset, offsetBase).format(format);


export {
	dateTimeStringToMoment,
	fromNow,
	inputRangeDate,
	now,
	toDateTimeString,
	toMoment,
};
