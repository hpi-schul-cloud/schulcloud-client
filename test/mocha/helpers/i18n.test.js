const chai = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');

const config = {
	defaultLanguage: 'de',
	fallbackLanguage: 'de',
	availableLanguages: 'de,en,es,uk',
};

const mockReq = {
	headers: {
		'accept-language': 'it,en-EN,fr-CH,fr;q=0.9,en;q=0.8,de;q=0.7,*;q=0.5',
	},
};

Configuration.set('I18N__DEFAULT_LANGUAGE', config.defaultLanguage);
Configuration.set('I18N__FALLBACK_LANGUAGE', config.fallbackLanguage);
Configuration.set('I18N__AVAILABLE_LANGUAGES', config.availableLanguages);
const i18n = require('../../../helpers/i18n');

describe('i18n helpers test', () => {
	it('Check for defaultLanguage', () => {
		chai
			.expect(i18n.defaultLanguage)
			.to.equal(
				config.defaultLanguage,
				`The default language should be ${config.defaultLanguage}`,
			);
	});

	it('Check for fallbackLanguage', () => {
		chai
			.expect(i18n.fallbackLanguage)
			.to.equal(
				config.fallbackLanguage,
				`The fallback language should be ${config.fallbackLanguage}`,
			);
	});

	it('Check for availableLanguages', () => {
		const testAvailableLanguages = config.availableLanguages
			.split(',')
			.map((value) => value.trim());
		chai
			.expect(i18n.availableLanguages)
			.to.eql(
				testAvailableLanguages,
				`The available languages should be ${JSON.stringify(testAvailableLanguages)}`,
			);
	});

	describe('validateLanguage', () => {
		it('returns supported languages unchanged', () => {
			for (const language of i18n.availableLanguages) {
				chai.expect(i18n.validateLanguage(language)).to.equal(language);
			}
		});

		it('falls back to the default language for invalid values', () => {
			const invalidValues = [
				'he', '', ' de ', 'DE', '</script><script>alert(1)</script>',
				undefined, null, false, 1, ['en'], { language: 'en' },
			];
			for (const language of invalidValues) {
				chai.expect(i18n.validateLanguage(language)).to.equal(config.defaultLanguage);
			}
		});
	});

	describe('getCurrentLanguage', () => {
		const preferences = {
			locals: { currentUser: { language: 'en' }, currentSchoolData: { language: 'es' } },
		};

		it('keeps a supported query language ahead of saved preferences', async () => {
			const language = await i18n.getCurrentLanguage({ query: { lng: 'uk' } }, preferences);
			chai.expect(language).to.equal('uk');
		});

		it('keeps the user preference when the query language is invalid', async () => {
			for (const lng of ['unsupported', ['de', 'en']]) {
				const language = await i18n.getCurrentLanguage({ query: { lng } }, preferences);
				chai.expect(language).to.equal('en');
			}
		});

		it('skips invalid user, school, and cookie preferences', async () => {
			const invalidPreferences = {
				locals: { currentUser: { language: {} }, currentSchoolData: { language: 'unsupported' } },
			};
			const fromCookie = await i18n.getCurrentLanguage({ cookies: { USER_LANG: 'uk' } }, invalidPreferences);
			const fromDefault = await i18n.getCurrentLanguage(
				{ cookies: { USER_LANG: 'unsupported' } },
				invalidPreferences,
			);
			chai.expect(fromCookie).to.equal('uk');
			chai.expect(fromDefault).to.equal(config.defaultLanguage);
		});

		it('uses the default language when the registration URL has no school ID', async () => {
			const language = await i18n.getCurrentLanguage({ url: '/registration/' }, { locals: {} });
			chai.expect(language).to.equal(config.defaultLanguage);
		});
	});

	it('Check changeLanguage(en)', async () => {
		await i18n.changeLanguage('en');
		chai
			.expect(i18n.i18next.language)
			.to.equal('en', 'The language should be set to "en"');
	});

	it('Check changeLanguage(he)', async () => {
		await i18n.changeLanguage('de');
		await i18n.changeLanguage('he');
		chai
			.expect(i18n.i18next.language)
			.to.equal('de', 'The language should be still "de" because "he" is unknown');
	});

	it('returns undefined when the browser supplies no supported language', () => {
		for (const req of [{ headers: {} }, { headers: { 'accept-language': 'it,fr' } }]) {
			chai.expect(i18n.getBrowserLanguage(req)).to.equal(undefined);
		}
	});

	it('Check getBrowserLanguage()', () => {
		const testBrowserLanguage = 'en';
		const browserLanguage = i18n.getBrowserLanguage(mockReq);
		chai
			.expect(browserLanguage)
			.to.eql(
				testBrowserLanguage,
				`The available languages should be ${JSON.stringify(testBrowserLanguage)}`,
			);
	});
});
