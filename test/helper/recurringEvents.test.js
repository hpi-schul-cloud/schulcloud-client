'use strict';

const chai = require('chai');
const expect = chai.expect;
const recurringEventsHelper = require('../../helpers/recurringEvents');
const recurringEvent = {
    "type": "event",
    "included": [
        {
            "type": "rrule",
            "id": "6fb22753-0764-4494-ae04-ba352e293ae9-rrule",
            "attributes": {
                "freq": "WEEKLY",
                "until": "2017-06-21T00:00:00.000Z",
                "wkst": "TH"
            }
        }
    ],
    "allDay": false,
    "start": 1493632800000,
    "end": 1493635500000,
    "url": "",
    "summary": "Geografie",
    "title": "Geografie",
    "location": "Paul-Gerhardt-Gymnasium",
    "description": "Test"
};

describe('Recurring Event Helper tests', function () {

    it('getIsoWeekdayForNumber', function () {
        expect(recurringEventsHelper.getIsoWeekdayForNumber(0)).to.equal('MO');
    });

    it('getNumberForFullCalendarWeekday', function () {
        expect(recurringEventsHelper.getNumberForFullCalendarWeekday('MO')).to.equal(1);
    });

    it('getWeekdayForNumber', function () {
        expect(recurringEventsHelper.getWeekdayForNumber(0)).to.equal('Montag');
    });

    it('getNumberForWeekday', function () {
        expect(recurringEventsHelper.getNumberForWeekday('Montag')).to.equal(0);
    });

    it('createRecurringEvents', function () {
        let recurringEvents = recurringEventsHelper.createRecurringEvents(recurringEvent);
        // 7 mondays from 1st May 2017 to 21first June 2017
        expect(recurringEvents.length).to.equal(7);
    });

});
