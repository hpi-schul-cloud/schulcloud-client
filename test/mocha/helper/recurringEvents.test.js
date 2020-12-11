const chai = require('chai');

const { expect } = chai;
const moment = require('moment-timezone');
const recurringEventsHelper = require('../../../helpers/recurringEvents');
const i18nHelper = require('../../../helpers/i18n');
const timesHelper = require('../../../helpers/timesHelper');

const recurringEvent = {
	type: 'event',
	included: [
		{
			type: 'rrule',
			id: '6fb22753-0764-4494-ae04-ba352e293ae9-rrule',
			attributes: {
				freq: 'WEEKLY',
				until: '2017-11-21T00:00:00.000Z',
				wkst: 'TH',
			},
		},
	],
	allDay: false,
	start: new Date('2017-10-20T10:00:00.000Z').getTime(),
	end: new Date('2017-10-20T10:45:00.000Z').getTime(),
	url: '',
	summary: 'Geografie',
	title: 'Geografie',
	location: 'Paul-Gerhardt-Gymnasium',
	description: 'Test',
};
// simple "res", so that translations can be loaded (with language German)
const res = { $t: i18nHelper.getInstance({}) };

describe('Recurring Event Helper tests', () => {
	before(() => {
		moment.tz.setDefault('Europe/Berlin');
	});

	it('getIsoWeekdayForNumber', () => {
		expect(recurringEventsHelper.getIsoWeekdayForNumber(0)).to.equal('MO');
	});

	it('getNumberForFullCalendarWeekday', () => {
		expect(recurringEventsHelper.getNumberForFullCalendarWeekday('MO')).to.equal(1);
	});

	it('getWeekdayForNumber', () => {
		expect(recurringEventsHelper.getWeekdayForNumber(0, res)).to.equal(i18nHelper.i18next.t('global.text.monday'));
	});

	it('getNumberForWeekday', () => {
		expect(recurringEventsHelper.getNumberForWeekday(i18nHelper.i18next.t('global.text.monday'), res)).to.equal(0);
	});

	it('findAllWeekEvents', () => {
		const startTime = '2017-10-20T10:00:00.000Z';
		const endTime = '2017-10-20T10:45:00.000Z';
		const until = '2017-11-21T00:00:00.000Z';
		const weekDay = 'TH';

		const recurringEvents = recurringEventsHelper.findAllWeekEvents(startTime, endTime, weekDay, until);
		expect(timesHelper.dateToDateTimeString(recurringEvents[0].start)).to.be.equal('26.10.2017 12:00');
		expect(timesHelper.dateToDateTimeString(recurringEvents[0].end)).to.be.equal('26.10.2017 12:45');

		expect(timesHelper.dateToDateTimeString(recurringEvents[1].start)).to.equal('02.11.2017 12:00');
		expect(timesHelper.dateToDateTimeString(recurringEvents[1].end)).to.equal('02.11.2017 12:45');
	});

	/**
	 * In this test the times are so taken that the first events are in the summer time
	 * and last events in the winter time.
	 * Winter time change in 2017 was on 29.10.2017
	 */
	it('createRecurringEvents summer time change', () => {
		const recurringEvents = recurringEventsHelper.createRecurringEvents(recurringEvent);
		expect(recurringEvents.length).to.be.equal(4);

		// summer time event
		expect(timesHelper.dateToDateTimeString(recurringEvents[0].start)).to.equal('26.10.2017 12:00');
		expect(timesHelper.dateToDateTimeString(recurringEvents[0].end)).to.equal('26.10.2017 12:45');

		// winter time events
		expect(timesHelper.dateToDateTimeString(recurringEvents[1].start)).to.equal('02.11.2017 12:00');
		expect(timesHelper.dateToDateTimeString(recurringEvents[1].end)).to.equal('02.11.2017 12:45');

		expect(timesHelper.dateToDateTimeString(recurringEvents[2].start)).to.equal('09.11.2017 12:00');
		expect(timesHelper.dateToDateTimeString(recurringEvents[2].end)).to.equal('09.11.2017 12:45');

		expect(timesHelper.dateToDateTimeString(recurringEvents[3].start)).to.equal('16.11.2017 12:00');
		expect(timesHelper.dateToDateTimeString(recurringEvents[3].end)).to.equal('16.11.2017 12:45');
	});

	it('createRecurringEvents start at the first course day', () => {
		const startTime = new Date('2020-12-11T10:00:00.000Z').getTime();
		const endTime = new Date('2020-12-11T10:45:00.000Z').getTime();
		const untilTime = '2020-12-21T00:00:00.000Z';
		const recurringEventStartingAtTheFirstCourseDay = {
			type: 'event',
			included: [
				{
					type: 'rrule',
					id: '6fb22753-0764-4494-ae04-ba352e293ae9-rrule',
					attributes: {
						freq: 'WEEKLY',
						until: untilTime,
						wkst: 'FR',
					},
				},
			],
			allDay: false,
			start: startTime,
			end: endTime,
			url: '',
			summary: 'Geografie',
			title: 'Geografie',
			location: 'Paul-Gerhardt-Gymnasium',
			description: 'Test',
		};

		const recurringEvents = recurringEventsHelper.createRecurringEvents(recurringEventStartingAtTheFirstCourseDay);
		expect(timesHelper.dateToDateTimeString(recurringEvents[0].start)).to.equal('11.12.2020 11:00');
		recurringEvents.forEach((event) => {
			expect(event.start.isSameOrAfter(moment(startTime))).to.be.true;
			expect(event.start.isSameOrBefore(moment(untilTime))).to.be.true;
		});
	});
});
