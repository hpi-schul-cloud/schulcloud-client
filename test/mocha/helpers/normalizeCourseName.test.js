const { expect } = require('chai');
const {
	ensureHasNoAsciiControlChar,
	decodeHtmlEntities,
} = require('../../../controllers/courses');

describe('ensureHasNoAsciiControlChar', () => {
	it('should accept a normal name including umlauts and punctuation', () => {
		expect(ensureHasNoAsciiControlChar('Mathe ÄÖÜ (Kurs)!')).to.equal(
			'Mathe ÄÖÜ (Kurs)!',
		);
	});

	it('should trim leading and trailing whitespace before saving', () => {
		expect(ensureHasNoAsciiControlChar('  Mathe ÄÖÜ (Kurs)!  ')).to.equal(
			'Mathe ÄÖÜ (Kurs)!',
		);
		expect(ensureHasNoAsciiControlChar(' Mathe')).to.equal('Mathe');
		expect(ensureHasNoAsciiControlChar('Mathe ')).to.equal('Mathe');
	});

	it('should accept names that contain HTML markup without encoding them', () => {
		expect(ensureHasNoAsciiControlChar('<img src=x onerror=alert(1)>')).to.equal(
			'<img src=x onerror=alert(1)>',
		);
		expect(ensureHasNoAsciiControlChar('Kurs "A" & B')).to.equal('Kurs "A" & B');
	});

	it('should accept names that contain literal < and > characters', () => {
		expect(ensureHasNoAsciiControlChar('Abc < Def')).to.equal('Abc < Def');
		expect(ensureHasNoAsciiControlChar('two > one')).to.equal(
			'two > one',
		);
	});

	it('should decode HTML entities so stored names are not double-encoded later', () => {
		expect(ensureHasNoAsciiControlChar('Transformation Oil =&gt; Electricity'))
			.to.equal('Transformation Oil => Electricity');
		expect(ensureHasNoAsciiControlChar('Kurs "A" &amp; B')).to.equal(
			'Kurs "A" & B',
		);
	});

	it('should reject non-strings', () => {
		expect(() => ensureHasNoAsciiControlChar(undefined)).to.throw(
			TypeError,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar(null)).to.throw(
			TypeError,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar(1)).to.throw(
			TypeError,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar({})).to.throw(
			TypeError,
			'Invalid course name',
		);
	});

	it('should reject blank names', () => {
		expect(() => ensureHasNoAsciiControlChar('')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar('   ')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar('\t\n')).to.throw(
			Error,
			'Invalid course name',
		);
	});

	it('should reject names containing ASCII control characters', () => {
		expect(() => ensureHasNoAsciiControlChar('bad\nname')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar('bad\tname')).to.throw(
			Error,
			'Invalid course name',
		);
		expect(() => ensureHasNoAsciiControlChar(`bad${String.fromCharCode(0x7f)}name`))
			.to.throw(Error, 'Invalid course name');
	});
});

describe('decodeHtmlEntities', () => {
	it('should decode HTML entities from the database', () => {
		expect(decodeHtmlEntities('Transformation Oil =&gt; Electricity')).to.equal(
			'Transformation Oil => Electricity',
		);
		expect(decodeHtmlEntities('&lt;script&gt;alert(1)&lt;/script&gt;')).to.equal(
			'<script>alert(1)</script>',
		);
		expect(decodeHtmlEntities('Kurs "A" &amp; B')).to.equal('Kurs "A" & B');
	});

	it('should leave already-decoded names unchanged', () => {
		expect(decodeHtmlEntities('Transformation Oil => Electricity')).to.equal(
			'Transformation Oil => Electricity',
		);
		expect(decodeHtmlEntities('Mathe ÄÖÜ (Kurs)!')).to.equal('Mathe ÄÖÜ (Kurs)!');
	});

	it('should return an empty string for non-strings', () => {
		expect(decodeHtmlEntities(undefined)).to.equal('');
		expect(decodeHtmlEntities(null)).to.equal('');
		expect(decodeHtmlEntities({})).to.equal('');
	});
});
