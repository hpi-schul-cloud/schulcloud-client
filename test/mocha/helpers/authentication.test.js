const chai = require('chai');
const { generateConsentPassword } = require('../../../helpers/authentication');

/**
 * PASSWORD PATTERN BASED ON PASSWORD POLICY:
 * - should contain at least one capital letter,
 * - should contain at least one small letter,
 * - should contain at least one digit,
 * - length of the password should be at least 12.
 */
const PASSWORD_POLICY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,255}$/;

describe('authentication helpers tests', () => {
	describe('generateConsentPassword should', () => {
		it('matches password policy requirements', () => {
			// when
			const generatedPassword = generateConsentPassword();

			// then
			chai.expect(generatedPassword).to.match(PASSWORD_POLICY_PATTERN);
		});
	});
});
