const { expect } = require('chai');
const { normalizeCourseName } = require('../../../controllers/courses');

describe('normalizeCourseName', () => {
	it('should accept a normal name including umlauts and punctuation', () => {
		expect(normalizeCourseName('  Mathe ÄÖÜ (Kurs)!  ')).to.equal(
			'Mathe ÄÖÜ (Kurs)!',
		);
	});

	it('should accept names that contain HTML markup without encoding them', () => {
		expect(normalizeCourseName('<img src=x onerror=alert(1)>')).to.equal(
			'<img src=x onerror=alert(1)>',
		);
		expect(normalizeCourseName('Kurs "A" & B')).to.equal('Kurs "A" & B');
	});

	it('should reject non-strings', () => {
		expect(() => normalizeCourseName(undefined)).to.throw(
			TypeError,
			'Invalid course name',
		);
		expect(() => normalizeCourseName(null)).to.throw(
			TypeError,
			'Invalid course name',
		);
		expect(() => normalizeCourseName(1)).to.throw(
			TypeError,
			'Invalid course name',
		);
		expect(() => normalizeCourseName({})).to.throw(
			TypeError,
			'Invalid course name',
		);
	});

	it('should reject blank names', () => {
		expect(() => normalizeCourseName('')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => normalizeCourseName('   ')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => normalizeCourseName('\t\n')).to.throw(
			Error,
			'Invalid course name',
		);
	});

	it('should reject names containing ASCII control characters', () => {
		expect(() => normalizeCourseName('bad\nname')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => normalizeCourseName('bad\tname')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => normalizeCourseName(`bad${String.fromCharCode(0x7f)}name`))
			.to.throw(Error, 'Invalid course name');
	});
});
