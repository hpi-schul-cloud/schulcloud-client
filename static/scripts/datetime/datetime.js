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

	toDateTimeString(date, format = DATETIME_FORMAT.dateTime) {
		moment(date).tz(calendarTimezone).format(format);
	},

	fromNow(date) {
		this.toMoment(date).fromNow();
	},

	nowToDateTimeString(format = DATETIME_FORMAT.dateTime) {
		this.toMoment().format(format);
	},

	inputRangeDate(offset = 0, offsetBase = 'y', format = DATETIME_FORMAT.dateTime) {
		this.toMoment().add(offset, offsetBase).format(format);
	},
};

export default datetime;
