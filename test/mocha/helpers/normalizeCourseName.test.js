const { expect } = require('chai');
const {
	checkValidName,
	decodeHtmlEntities,
} = require('../../../controllers/courses');

describe('checkValidName', () => {
	it('should accept a normal name including umlauts and punctuation', () => {
		expect(checkValidName('Mathe ÄÖÜ (Kurs)!')).to.equal(
			'Mathe ÄÖÜ (Kurs)!',
		);
	});

	it('should trim leading and trailing whitespace before saving', () => {
		expect(checkValidName('  Mathe ÄÖÜ (Kurs)!  ')).to.equal(
			'Mathe ÄÖÜ (Kurs)!',
		);
		expect(checkValidName(' Mathe')).to.equal('Mathe');
		expect(checkValidName('Mathe ')).to.equal('Mathe');
	});

	it('should accept names that contain HTML markup without encoding them', () => {
		expect(checkValidName('<img src=x onerror=alert(1)>')).to.equal(
			'<img src=x onerror=alert(1)>',
		);
		expect(checkValidName('Kurs "A" & B')).to.equal('Kurs "A" & B');
	});

	it('should accept names that contain literal < and > characters', () => {
		expect(checkValidName('Abc < Def')).to.equal('Abc < Def');
		expect(checkValidName('two > one')).to.equal(
			'two > one',
		);
	});

	it('should leave HTML entities unchanged', () => {
		expect(checkValidName('Transformation Oil =&gt; Electricity')).to.equal(
			'Transformation Oil =&gt; Electricity',
		);
		expect(checkValidName('Kurs "A" &amp; B')).to.equal('Kurs "A" &amp; B');
	});

	it('should reject non-strings', () => {
		expect(() => checkValidName(undefined)).to.throw(
			TypeError,
			'Name needs to be a string',
		);
		expect(() => checkValidName(null)).to.throw(TypeError, 'Name needs to be a string');
		expect(() => checkValidName(1)).to.throw(TypeError, 'Name needs to be a string');
		expect(() => checkValidName({})).to.throw(TypeError, 'Name needs to be a string');
	});

	it('should reject blank names', () => {
		expect(() => checkValidName('')).to.throw('Name cannot be empty');
		expect(() => checkValidName('   ')).to.throw('Name cannot be empty');
		expect(() => checkValidName('\t\n')).to.throw('Name cannot be empty');
	});

	it('should reject names containing ASCII control characters', () => {
		expect(() => checkValidName('bad\nname')).to.throw(
			'Name cannot contain ASCII control characters',
		);
		expect(() => checkValidName('bad\tname')).to.throw(
			'Name cannot contain ASCII control characters',
		);
		expect(() => checkValidName(`bad${String.fromCharCode(0x7f)}name`))
			.to.throw('Name cannot contain ASCII control characters');
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
