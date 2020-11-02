const chai = require('chai');
const moment = require('moment-timezone');

const timesHelper = require('../../../helpers/timesHelper');

const defaultTimezone = 'Europe/Berlin';
const testDate = new Date(Date.UTC(2019, 10, 1, 1, 0));

const getMockRes = (timezone) => ({ locals: { currentSchoolData: { timezone } } });
const getMockReq = (timezone) => ({ cookies: { USER_TIMEZONE: { timezone } } });

const setSchoolTimezone = (schoolTimezone) => {
	const mockRes = getMockRes(schoolTimezone);
	const mockReq = getMockReq(schoolTimezone);
	timesHelper.setDefaultTimezone(mockReq, mockRes);
};

describe('times helpers test', () => {
	beforeEach(() => {
		moment.locale('en');
		moment.tz.setDefault(defaultTimezone);
	});

	it('Check for default UTC offset', () => {
		const checkTZ = moment().tz(defaultTimezone).format('Z');
		chai
			.expect(timesHelper.getUtcOffset())
			.to.equal(
				checkTZ,
				`The default offset for ${defaultTimezone} should be ${checkTZ}`,
			);
	});

	it('set school timezone as default', () => {
		const schoolTimezone = 'America/Los_Angeles';
		const schoolTimezoneOffset = moment().tz(schoolTimezone).format('Z');
		const mockRes = getMockRes(schoolTimezone);
		const mockReq = getMockReq(schoolTimezone);

		timesHelper.setDefaultTimezone(mockReq, mockRes);
		chai.expect(mockRes.locals.currentTimezone)
			.to.equal(schoolTimezone, `The default timezone should be equal to ${schoolTimezone}`);
		chai.expect(mockRes.locals.currentTimezoneOffset)
			.to.equal(schoolTimezoneOffset, `The default timezone offset should be equal to ${schoolTimezoneOffset}`);
	});

	it('should correctly split date', () => {
		const schoolTimezone = 'America/Los_Angeles';
		const schoolTimezoneOffset = moment().tz(schoolTimezone).format('Z');

		setSchoolTimezone(schoolTimezone);
		const expectedDate = {
			timestamp: 1572570000000,
			date: '31.10.2019',
			time: `18:00(UTC${schoolTimezoneOffset})`,
		};
		const dateFormat = 'DD.MM.YYYY';
		const resultDate = timesHelper.splitDate(testDate, dateFormat);
		chai.expect(resultDate.timestamp)
			.to.equal(expectedDate.timestamp);
		chai.expect(resultDate.time)
			.to.equal(expectedDate.time);
		chai.expect(resultDate.date)
			.to.equal(expectedDate.date);
	});

	it('should properly format date', () => {
		const testFormat = 'DD.MM.YYYY HH:mm';
		const schoolTimezone = 'America/Los_Angeles';
		const schoolTimezoneOffset = moment().tz(schoolTimezone).format('Z');

		setSchoolTimezone(schoolTimezone);
		const resultDate = timesHelper.formatDate(testDate, testFormat);
		chai.expect(resultDate)
			.to.equal('31.10.2019 18:00');

		const resultDate2 = timesHelper.formatDate(testDate, testFormat, true);
		chai.expect(resultDate2)
			.to.equal(`31.10.2019 18:00(UTC${schoolTimezoneOffset})`);
	});

	it('should correctly display time string', () => {
		const testFormat = 'MM/DD/YYYY HH:mm';
		const timeToString = timesHelper.timeToString(testDate, testFormat, false);
		chai.expect(timeToString).to.equal('11/01/2019 02:00');
	});

	it('should correctly display time string from now', () => {
		const testFormat = 'MM/DD/YYYY HH:mm';
		const tomorrow = moment().add(1, 'day').toDate();
		const timeToTomorrow = timesHelper.timeToString(tomorrow, testFormat);
		chai.expect(timeToTomorrow).to.equal('in a day');
	});
});
