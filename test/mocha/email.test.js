/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

function getEmailValidationPatternFromBaseJs() {
	const baseJsPath = path.resolve(__dirname, '../../static/scripts/base.js');
	const baseJsSource = fs.readFileSync(baseJsPath, 'utf8');
	const match = baseJsSource.match(/const EMAIL_VALIDATION_PATTERN\s*=\s*"((?:\\.|[^"\\])*)"/);

	if (!match) {
		throw new Error('EMAIL_VALIDATION_PATTERN not found in static/scripts/base.js');
	}

	return match[1].replace(/\\\\/g, '\\');
}

function tryCompile(pattern) {
	try {
		return { regex: new RegExp(pattern, 'v') };
	} catch (error) {
		return { error };
	}
}

describe('email pattern v-flag migration', () => {
	const emailValidationPattern = getEmailValidationPatternFromBaseJs();
	const domainLabel63 = 'a'.repeat(63);
	const domainLabel64 = 'a'.repeat(64);

	const validEmails = [
		'me@example.org',
		'a.b-c_d+tag@example-domain.org',
		"special.!#$%&'*+/=?^_`{|}~-chars@example.org",
		'local@sub.domain.example',
		'USER+tag/ops=1@example.COM',
		`edgecase@${domainLabel63}.org`,
		`multi.level@sub.${domainLabel63}.example`,
		'müller@example.de',
		'用户@例子.广告',
		'अजय@डाटा.भारत',
		'квіточка@пошта.укр',
		'θσερ@εχαμπλε.ψομ',
		'Dörte@Sörensen.example.com',
		'коля@пример.рф',
		'我買@屋企.香港',
		'甲斐@黒川.日本',
		'чебурашка@ящик-с-апельсинами.рф',
	];

	const invalidEmails = [
		'',
		'just-text',
		'@example.org',
		'me@',
		'me@@example.org',
		'me example@example.org',
		'me@example..org',
		'me@example.org ',
		' me@example.org',
		'me@-example.org',
		'me@example-.org',
		'me@example_.org',
		'me@example',
		'x@a',
		'peter@example',
		`toolonglabel@${domainLabel64}.org`,
		'user@[127.0.0.1]',
		'user@.example.org',
		'user@example.org.',
		'test@domain.d​e', // contains a zero-width space character (U+200B) 'test@domain.d\u200Be'
	];

	it('compiles the pattern with v-flag', () => {
		const compiledPattern = tryCompile(emailValidationPattern);

		expect(compiledPattern.error).to.be.undefined;
		expect(compiledPattern.regex).to.be.instanceOf(RegExp);
		expect(compiledPattern.regex.flags).to.include('v');
	});

	it('has a usable compiled regex for validation', () => {
		const compiledPattern = tryCompile(emailValidationPattern);

		expect(compiledPattern.error).to.be.undefined;
		expect(compiledPattern.regex).to.be.instanceOf(RegExp);
	});

	it('compiles a fully v-compatible reference pattern', () => {
		const compiledReference = tryCompile(emailValidationPattern);

		expect(compiledReference.error).to.be.undefined;
		expect(compiledReference.regex).to.be.instanceOf(RegExp);
		expect(compiledReference.regex.flags).to.include('v');
	});

	describe('when testing against valid email addresses', () => {
		it('should succeed', () => {
			const compiledReference = tryCompile(emailValidationPattern);
			expect(compiledReference.error).to.be.undefined;

			validEmails.forEach((email) => {
				expect(compiledReference.regex.test(email), `expected valid: ${email}`).to.equal(true);
			});
		});
	});

	describe('when testing against invalid email addresses', () => {
		it('should fail', () => {
			const compiledReference = tryCompile(emailValidationPattern);

			expect(compiledReference.error).to.be.undefined;

			invalidEmails.forEach((email) => {
				expect(compiledReference.regex.test(email), `expected invalid: ${email}`).to.equal(false);
			});
		});
	});

	describe('when testing email without top-level domain (special case of invalid email)', () => {
		it('should fail', () => {
			const compiledPattern = tryCompile(emailValidationPattern);
			expect(compiledPattern.error).to.be.undefined;

			expect(compiledPattern.regex.test('peter@example')).to.equal(false);
		});
	});
});
