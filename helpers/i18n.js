const i18next = require('i18next');
const i18nMoment = require('moment');

const Backend = require('i18next-fs-backend');
const path = require('path');
const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('./logger');
const api = require('../api');
const momentHelper = require('./momentHelper');

const i18nDebug = Configuration.get('I18N__DEBUG');
const fallbackLanguage = Configuration.get('I18N__FALLBACK_LANGUAGE');
const defaultLanguage = Configuration.get('I18N__DEFAULT_LANGUAGE');
const availableLanguages = (Configuration.get('I18N__AVAILABLE_LANGUAGES') || '')
	.split(',')
	.map((value) => value.trim());

const isValidLanguage = (language) => (
	typeof language === 'string' && language.length > 0 && availableLanguages.includes(language)
);

if (!isValidLanguage(defaultLanguage)) {
	throw new Error('I18N__DEFAULT_LANGUAGE must be a non-empty language listed in I18N__AVAILABLE_LANGUAGES');
}

const validateLanguage = (language) => (
	isValidLanguage(language) ? language : defaultLanguage
);

const localeDir = path.join(__dirname, '../locales');

i18next
	.use(Backend)
	.init({
		debug: i18nDebug,
		lng: defaultLanguage,
		fallbackLng: fallbackLanguage,
		supportedLngs: availableLanguages || false,
		backend: {
			loadPath: `${localeDir}/{{lng}}.json`,
		},
	})
	.catch(logger.error);

const getSchoolLanguage = async (req, schoolId) => {
	let school;
	try {
		school = await api(req).get(`/registrationSchool/${schoolId}`);
	} catch {
		return null;
	}

	const language = school?.language;
	if (isValidLanguage(language)) {
		return language;
	}
	return null;
};

const getBrowserLanguage = (req) => {
	const acceptLanguage = req?.headers?.['accept-language'];
	if (!acceptLanguage) {
		return undefined;
	}

	const language = acceptLanguage
		.split(',')
		.map((value) => value.split(';')[0].split('-')[0].trim())
		.find(isValidLanguage);

	return language;
};

const getCurrentLanguage = async (req, res) => {
	const queryLanguage = req?.query?.lng;
	if (isValidLanguage(queryLanguage)) {
		return queryLanguage;
	}

	const { currentUser, currentSchoolData } = res?.locals ?? {};

	const userLanguage = currentUser?.language;
	if (isValidLanguage(userLanguage)) {
		return userLanguage;
	}

	const schoolLanguage = currentSchoolData?.language;
	if (isValidLanguage(schoolLanguage)) {
		return schoolLanguage;
	}

	const cookieLanguage = req?.cookies?.USER_LANG;
	if (isValidLanguage(cookieLanguage)) {
		return cookieLanguage;
	}

	const registrationSchoolId = req?.url?.match(/^\/registration\/(.*)\?/)?.[1];
	const registrationLanguage = registrationSchoolId ? await getSchoolLanguage(req, registrationSchoolId) : undefined;
	if (registrationLanguage) {
		return registrationLanguage;
	}

	return defaultLanguage;
};

const getInstance = () => (key, options = {}) => i18next.t(key, {
	...options,
});

const changeLanguage = async (langAttribute) => {
	if (availableLanguages.includes(langAttribute)) {
		const momentOptions = momentHelper.selectMomentOptions(langAttribute);
		i18nMoment.locale(langAttribute, momentOptions);
		if (langAttribute === 'de') {
			i18nMoment.updateLocale('de', {
				relativeTime: {
					future: 'in %s',
					past: 'vor %s',
					s: 'ein paar Sekunden',
					ss: '%d Sekunden',
					m: 'einer Minute',
					mm: '%d Minuten',
					h: 'einer Stunde',
					hh: '%d Stunden',
					d: 'einem Tag',
					dd: '%d Tagen',
					M: 'einem Monat',
					MM: '%d Monaten',
					y: 'einem Jahr',
					yy: '%d Jahren',
				},
			});
		}
		return i18next.changeLanguage(langAttribute);
	}
	return false;
};

module.exports = {
	i18next,
	defaultLanguage,
	fallbackLanguage,
	availableLanguages,
	getInstance,
	isValidLanguage,
	validateLanguage,
	changeLanguage,
	getCurrentLanguage,
	getBrowserLanguage,
	i18nMoment,
};
