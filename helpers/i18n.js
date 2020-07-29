const i18next = require('i18next');
const Backend = require('i18next-sync-fs-backend');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const defaultLanguage = 'de';
const localeDir = path.join(__dirname, '../locales');

const availableLanuages = fs.readdirSync(localeDir)
	.filter((filename) => filename.endsWith('.json'))
	.map((filename) => filename.replace('.json', ''));

i18next
	.use(Backend)
	.init({
		initImmediate: false,
		lng: defaultLanguage,
		fallbackLng: availableLanuages.filter((lng) => lng !== defaultLanguage),
		backend: {
			loadPath: `${localeDir}/{{lng}}.json`,
		},
	})
	.then(() => {
		logger.info('i18n initialized');
	})
	.catch(logger.error);

const getUserLanguage = (user = {}) => {
	let lang = defaultLanguage;
	if (user.preferences && user.preferences.language) {
		lang = user.preferences.language;
	}
	return lang;
};

const getInstance = (user) => {
	const userLng = getUserLanguage(user);

	return (key, options = {}) => i18next.t(key, {
		lng: userLng,
		fallbackLng: availableLanuages.filter((lng) => lng !== userLng),
		...options,
	});
};

module.exports = {
	defaultLanguage,
	getUserLanguage,
	availableLanuages,
	getInstance,
};
