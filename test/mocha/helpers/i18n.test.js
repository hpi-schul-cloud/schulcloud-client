const chai = require('chai');
const { Configuration } = require('@schul-cloud/commons');

const config = {
    defaultLanguage: 'de',
    fallbackLanguage: 'de',
    availableLanguages: 'de,en,fr'
}

const mockReq = {
    headers: {
        'accept-language': 'it,en-EN,fr-CH,fr;q=0.9,en;q=0.8,de;q=0.7,*;q=0.5',
    }
};

Configuration.set('I18N__DEFAULT_LANGUAGE', config.defaultLanguage);
Configuration.set('I18N__FALLBACK_LANGUAGE', config.fallbackLanguage);
Configuration.set('I18N__AVAILABLE_LANGUAGES', config.availableLanguages);
const i18n = require('../../../helpers/i18n');

describe('i18n helpers test', () => {
    it('Check for defaultLanguage', () => {
		chai.expect(i18n.defaultLanguage).to.equal(config.defaultLanguage, `The default language should be ${config.defaultLanguage}`);
    });

    it('Check for fallbackLanguage', () => {
		chai.expect(i18n.fallbackLanguage).to.equal(config.fallbackLanguage, `The fallback language should be ${config.fallbackLanguage}`);
    });

    it('Check for availableLanguages', () => {
        const testAvailableLanguages = config.availableLanguages.split(',')
		chai.expect(i18n.availableLanguages).to.eql(testAvailableLanguages, `The available languages should be ${JSON.stringify(testAvailableLanguages)}`);
    });

    it('Check changeLanguage(en)', async () => {
        await i18n.changeLanguage('en');
		chai.expect(i18n.i18next.language).to.equal('en', 'The language should be set to "en"');
    });

    it('Check changeLanguage(he)', async () => {
        await i18n.changeLanguage('de');
        await i18n.changeLanguage('he');
		chai.expect(i18n.i18next.language).to.equal('de', 'The language should be still "de" because "he" is unknown');
    });

    it('Check getBrowserLanguage()', () => {
        const testBrowserLanguage = 'en';
        const browserLanguage = i18n.getBrowserLanguage(mockReq);
		chai.expect(browserLanguage).to.eql(testBrowserLanguage, `The available languages should be ${JSON.stringify(testBrowserLanguage)}`);
    });
});