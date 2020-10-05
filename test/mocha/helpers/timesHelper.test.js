const chai = require('chai');
const moment = require('moment-timezone');

const timesHelper = require('../../../helpers/timesHelper');

const defaultTimezone = 'Europe/Berlin';
const testDate = new Date(Date.UTC(2020, 10, 1, 1, 0));

const getMockRes = (timezone) => ({ locals: { currentSchoolData: { timezone } } });

const setSchoolTimezone = (schoolTimezone) => {
	const mockRes = getMockRes(schoolTimezone);
	timesHelper.setDefaultTimezone(mockRes);
};

describe('times helpers test', () => {
	beforeEach(() => {
		moment.tz.setDefault(defaultTimezone);
	});

	it('Check for default UTC offset', () => {
		chai
			.expect(timesHelper.getUtcOffset())
			.to.equal(
				'+02:00',
				`The default offset for ${defaultTimezone} should be +02:00`,
			);
	});

	it('set school timezone as default', () => {
		const schoolTimezone = 'America/Los_Angeles';
		const schoolTimezoneOffset = '-07:00';
		const mockRes = getMockRes(schoolTimezone);

		timesHelper.setDefaultTimezone(mockRes);
		chai.expect(mockRes.locals.currentTimezone)
			.to.equal(schoolTimezone, `The default timezone should be equal to ${schoolTimezone}`);
		chai.expect(mockRes.locals.currentTimezoneOffset)
			.to.equal(schoolTimezoneOffset, `The default timezone offset should be equal to ${schoolTimezoneOffset}`);
	});

	it('should correctly split date', () => {
		setSchoolTimezone('America/Los_Angeles');
		const expectedDate = {
			timestamp: 1604192400000,
			date: '31.10.2020',
			time: '18:00(UTC-07:00)',
		};
		const resultDate = timesHelper.splitDate(testDate);
		chai.expect(resultDate.timestamp)
			.to.equal(expectedDate.timestamp);
		chai.expect(resultDate.time)
			.to.equal(expectedDate.time);
		chai.expect(resultDate.date)
			.to.equal(expectedDate.date);
	});

	it('should properly format date', () => {
		const testFormat = 'YYYY-MM-DD HH:mm:ss';
		setSchoolTimezone('America/Los_Angeles');
		const resultDate = timesHelper.formatDate(testDate, testFormat);
		chai.expect(resultDate)
			.to.equal('2020-10-31 18:00:00');

		const resultDate2 = timesHelper.formatDate(testDate, testFormat, true);
		chai.expect(resultDate2)
			.to.equal('2020-10-31 18:00:00(UTC-07:00)');
	});

	it('should correctly clone UTC date', () => {
		setSchoolTimezone('America/Los_Angeles');
		const resultDate = timesHelper.cloneUtcDate(testDate);
		chai.expect(resultDate.toISOString(true))
			.to.equal('2020-11-01T01:00:00.000-07:00');
	});
});
