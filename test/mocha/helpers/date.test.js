const { expect } = require('chai');
const { normalizeDate } = require('../../../helpers/date');

describe('date helper', () => {
	it('should normalize a given date string', () => {
		expect(normalizeDate('20.01.2004', 'de')).to.eq('20.01.2004');
		expect(normalizeDate('01/20/2004', 'en')).to.eq('20.01.2004');
		expect(normalizeDate('01/20/2004', 'es')).to.eq('20.01.2004');
	});

	it('should throw if the language is not supported', () => {
		expect(() => normalizeDate('20.01.2004', 'fr')).to.throw();
	});

	it('should throw if no language is provided', () => {
		expect(() => normalizeDate('20.01.2004')).to.throw();
		expect(() => normalizeDate('20.01.2004', '')).to.throw();
	});

	it('should throw if the date string is invalid', () => {
		expect(() => normalizeDate('20/01.2004')).to.throw();
		expect(() => normalizeDate('')).to.throw();
		expect(() => normalizeDate('jehfdjks')).to.throw();
	});

	it('should throw if the date string is undefined', () => {
		expect(() => normalizeDate(undefined)).to.throw();
	});

});
