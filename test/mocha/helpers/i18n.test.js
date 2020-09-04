const chai = require('chai');
const { Configuration } = require('@schul-cloud/commons');

const config = {
    defaultLanguage: 'de',
    fallbackLanguage: 'en',
    availableLanguages: 'de,en,fr'
}

const mockReq = {
    headers: {
        'accept-language': 'it,en-EN,fr-CH,fr;q=0.9,en;q=0.8,de;q=0.7,*;q=0.5',
    }
};

describe('i18n helpers test', () => {
    Configuration.set('I18N__DEFAULT_LANGUAGE', config.defaultLanguage);
    Configuration.set('I18N__FALLBACK_LANGUAGE', config.fallbackLanguage);
    Configuration.set('I18N__AVAILABLE_LANGUAGES', config.availableLanguages);

    it('Check for defaultLanguage', () => {
        const { defaultLanguage } = require('../../../helpers/i18n');
		chai.expect(defaultLanguage).to.equal(config.defaultLanguage, `The default language should be ${config.defaultLanguage}`);
    });

    it('Check for fallbackLanguage', () => {
        const { fallbackLanguage } = require('../../../helpers/i18n');
		chai.expect(fallbackLanguage).to.equal(config.fallbackLanguage, `The fallback language should be ${config.fallbackLanguage}`);
    });

    it('Check for availableLanguages', () => {
        const testAvailableLanguages = config.availableLanguages.split(',')
        const { availableLanguages } = require('../../../helpers/i18n');
		chai.expect(availableLanguages).to.eql(testAvailableLanguages, `The available languages should be ${JSON.stringify(testAvailableLanguages)}`);
    });

    it('Check changeLanguage(en)', async () => {
        const { i18next, changeLanguage } = require('../../../helpers/i18n');
        await changeLanguage('en');
		chai.expect(i18next.language).to.equal('en', 'The language should be set to "en"');
    });

    it('Check changeLanguage(he)', async () => {
        const { i18next, changeLanguage } = require('../../../helpers/i18n');
        await changeLanguage('de');
        await changeLanguage('he');
		chai.expect(i18next.language).to.equal('de', 'The language should be still "de" because "he" is unknown');
    });

    it('Check getBrowserLanguage()', () => {
        const { getBrowserLanguage } = require('../../../helpers/i18n');
        const testBrowserLanguage = 'en';
        const browserLanguage = getBrowserLanguage(mockReq);
		chai.expect(browserLanguage).to.eql(testBrowserLanguage, `The available languages should be ${JSON.stringify(testBrowserLanguage)}`);
    });
});