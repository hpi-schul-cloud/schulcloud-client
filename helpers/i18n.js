const i18next = require('i18next');
const Backend = require('i18next-sync-fs-backend');
const fs = require('fs');
const path = require('path');
const { Configuration } = require('@schul-cloud/commons');
const logger = require('./logger');

const i18nDebug = Configuration.get('I18N__DEBUG');
const i18nFallbackLanguage = Configuration.get('I18N__FALLBACK_LANGUAGE');
const i18nDefaultLanguage = Configuration.get('I18N__DEFAULT_LANGUAGE');

const localeDir = path.join(__dirname, '../locales');
const availableLanuages = fs.readdirSync(localeDir)
	.filter((filename) => filename.endsWith('.json'))
	.map((filename) => filename.replace('.json', ''));

i18next
	.use(Backend)
	.init({
		debug: i18nDebug,
		initImmediate: false,
		lng: i18nDefaultLanguage,
		fallbackLng: i18nFallbackLanguage,
		supportedLngs: availableLanuages || false,
		backend: {
			loadPath: `${localeDir}/{{lng}}.json`,
		},
	})
	.then(() => {
		logger.info('i18n initialized');
	})
	.catch(logger.error);

const getCurrentLanguage = (req, res) => {
	const { currentUser, currentSchoolData } = (res || {}).locals;
	// get language by user
	if (currentUser && currentUser.defaultLanguage) {
		return currentUser.defaultLanguage;
	}

	// get language by school
	if (currentSchoolData && currentSchoolData.defaultLanguage) {
		return currentSchoolData.defaultLanguage;
	}

	// get language by query
	const { lng } = (req || {}).query || {};
	if (lng) {
		return lng;
	}

	// get language by cookie
	if (req && req.cookies && req.cookies.USER_LANG) {
		return req.cookies.USER_LANG;
	}
	return null;
};

const getInstance = () => (key, options = {}) => i18next.t(key, {
	...options,
});

const changeLanguage = (lng) => {
	if (availableLanuages.includes(lng)) {
		return i18next.changeLanguage(lng);
	}
	return false;
};

module.exports = {
	defaultLanguage: i18nDefaultLanguage,
	availableLanuages,
	getInstance,
	changeLanguage,
	getCurrentLanguage,
};
