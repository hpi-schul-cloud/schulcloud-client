const i18next = require('i18next');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const defaultLanguage = 'en';
const localeDir = '../locale';

// load in and cache language files
const languageKeys = {};
const files = fs.readdirSync(path.join(__dirname, localeDir));
files.forEach((filename) => {
	if (!filename.endsWith('.json')) {
		return; // skip
	}
	const lang = filename.replace('.json', '');
	languageKeys[lang] = {
		translation: JSON.parse(
			fs.readFileSync(path.join(__dirname, localeDir, filename)),
		),
	};
});
const availableLanuages = Object.keys(languageKeys)
i18next
	.init({
		lng: defaultLanguage,
		fallbackLng: availableLanuages,
		resources: languageKeys,
	})
	.then(() => {
		logger.info('i18n initialized');
	})
	.catch(logger.error);

// PERFORMANCE TESTS
// switch lang only:
// 1.185.294/s

// with t() output:
// without lang switch:    137.979/s
// with lang switch:       115.459/s
// with const lang on t(): 118.422/s
// lang switch on t():     123.035/s

const getUserLanguage = (user = {}) => {
	let lang = defaultLanguage;
	if (user.preferences && user.preferences.language) {
		lang = user.preferences.language;
	}
	return lang;
};

const getInstance = (user) => {
	const lng = getUserLanguage(user);

	return (key, options = {}) => i18next.t(key, {
		lng,
		fallbackLng: availableLanuages,
		...options,
	});
};

module.exports = {
	defaultLanguage,
	availableLanuages,
	getInstance,
};
