import moment from 'moment-timezone';

const DATETIME_FORMAT = {
	date: $t('format.dateToPicker'),
	dateTime: $t('format.dateTimeToPicker'),
};

const calendarTimezone = document.querySelector('html').getAttribute('timezone');
const now = () => moment();

const toMoment = (date) => {
	const momentDate = date ? moment(date) : now();
	return momentDate(date).tz(calendarTimezone);
};

const dateTimeStringToMoment = (date, format = DATETIME_FORMAT.dateTime) => moment(date, format);

const toDateTimeString = (date, format = DATETIME_FORMAT.dateTime) => moment(date).tz(calendarTimezone).format(format);

const fromNow = (date) => toMoment(date).fromNow();

const nowToDateTimeString = (format = DATETIME_FORMAT.dateTime) => toMoment().format(format);

// eslint-disable-next-line max-len
const inputRangeDate = (offset = 0, offsetBase = 'y', format = DATETIME_FORMAT.dateTime) => toMoment().add(offset, offsetBase).format(format);


export {
	dateTimeStringToMoment,
	fromNow,
	inputRangeDate,
	now,
	nowToDateTimeString,
	toDateTimeString,
	toMoment,
};
