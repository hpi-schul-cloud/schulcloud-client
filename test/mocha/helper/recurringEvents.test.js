const chai = require('chai');

const { expect } = chai;
const recurringEventsHelper = require('../../../helpers/recurringEvents');
const i18nHelper = require('../../../helpers/i18n');

const recurringEvent = {
	type: 'event',
	included: [
		{
			type: 'rrule',
			id: '6fb22753-0764-4494-ae04-ba352e293ae9-rrule',
			attributes: {
				freq: 'WEEKLY',
				until: '2017-06-21T00:00:00.000Z',
				wkst: 'TH',
			},
		},
	],
	allDay: false,
	start: 1493632800000,
	end: 1493635500000,
	url: '',
	summary: 'Geografie',
	title: 'Geografie',
	location: 'Paul-Gerhardt-Gymnasium',
	description: 'Test',
};
// simple "res", so that translations can be loaded (with language German)
const res = { $t: i18nHelper.getInstance({}) };

describe('Recurring Event Helper tests', () => {
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

	it('createRecurringEvents', () => {
		const recurringEvents = recurringEventsHelper.createRecurringEvents(recurringEvent);
		// 7 mondays from 1st May 2017 to 21first June 2017
		expect(recurringEvents.length).to.equal(7);
	});
});
