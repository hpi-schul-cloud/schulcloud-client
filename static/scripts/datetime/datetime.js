import moment from 'moment-timezone';

const DATETIME_FORMAT = {
	date: $t('format.dateToPicker'),
	dateTime: $t('format.dateTimeToPicker'),
};

const calendarTimezone = document.querySelector('html').getAttribute('timezone');
const datetime = {

	now() {
		moment();
	},

	toMoment(date) {
		const momentDate = date ? moment(date) : this.now();
		momentDate(date).tz(calendarTimezone);
	},

	dateTimeStringToMoment(date, format = DATETIME_FORMAT.dateTime) {
		moment(date, format);
	},

	toDateTimeString(date) {
		moment(date).tz(calendarTimezone).format(DATETIME_FORMAT.dateTime);
	},

	fromNow(date) {
		this.toMoment(date).fromNow();
	},

	nowToDateTimeString() {
		this.toMoment().format(DATETIME_FORMAT.dateTime);
	},

	inputRangeDate(offset = 0, offsetBase = 'y') {
		this.toMoment().add(offset, offsetBase).format(DATETIME_FORMAT.dateTime);
	},
};

export default datetime;
