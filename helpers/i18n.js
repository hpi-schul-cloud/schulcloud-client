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

const isAvailableLanguage = (language) => (
	typeof language === 'string' && language.length > 0 && availableLanguages.includes(language)
);

if (!isAvailableLanguage(defaultLanguage)) {
	logger.error(`Validation failed: defaultLanguage="${defaultLanguage}" is not available`);
	throw new Error('I18N__DEFAULT_LANGUAGE must be a non-empty language listed in I18N__AVAILABLE_LANGUAGES');
}

const validateLanguage = (language) => (
	isAvailableLanguage(language) ? language : defaultLanguage
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
	.then(() => {
		logger.info('i18n initialized');
	})
	.catch(logger.error);

const getSchoolLanguage = async (req, schoolId) => {
	let school;
	try {
		school = await api(req).get(`/registrationSchool/${schoolId}`);
	} catch {
		logger.warn('Could not load the registration school language');
		return undefined;
	}

	const language = school?.language;
	if (isAvailableLanguage(language)) {
		logger.info(`getSchoolLanguage: Found available language="${language}" for schoolId="${schoolId}"`);
		return language;
	}
	logger.info(`getSchoolLanguage: language="${language}" is not available for schoolId="${schoolId}"`);
	return undefined;
};

const getBrowserLanguage = (req) => {
	const acceptLanguage = req?.headers?.['accept-language'];
	if (!acceptLanguage) {
		logger.info('getBrowserLanguage: acceptLanguage header not found');
		return undefined;
	}

	const language = acceptLanguage
		.split(',')
		.map((value) => value.split(';')[0].split('-')[0].trim())
		.find(isAvailableLanguage);

	if (language) {
		logger.info(`getBrowserLanguage: Found available language="${language}" from acceptLanguage="${acceptLanguage}"`);
	} else {
		logger.info(`getBrowserLanguage: No available language found in acceptLanguage="${acceptLanguage}"`);
	}
	return language;
};

const getCurrentLanguage = async (req, res) => {
	//const queryLanguage = req?.query?.lng;
	//if (isAvailableLanguage(queryLanguage)) {
	//	logger.info(`getCurrentLanguage: Using query parameter language="${queryLanguage}"`);
	//	return queryLanguage;
	//}

	//const { currentUser, currentSchoolData } = res?.locals ?? {};

	//const userLanguage = currentUser?.language;
	//if (isAvailableLanguage(userLanguage)) {
	//	logger.info(`getCurrentLanguage: Using user language="${userLanguage}"`);
	//	return userLanguage;
	//}

	//const schoolLanguage = currentSchoolData?.language;
	//if (isAvailableLanguage(schoolLanguage)) {
	//	logger.info(`getCurrentLanguage: Using school language="${schoolLanguage}"`);
	//	return schoolLanguage;
	//}

	////const cookieLanguage = req?.cookies?.USER_LANG;
	////if (isAvailableLanguage(cookieLanguage)) {
	////	logger.info(`getCurrentLanguage: Using cookie language="${cookieLanguage}"`);
	////	return cookieLanguage;
	////}

	//const registrationSchoolId = req?.url?.match(/^\/registration\/(.*)\?/)?.[1];
	//const registrationLanguage = registrationSchoolId ? await getSchoolLanguage(req, registrationSchoolId) : undefined;
	//if (registrationLanguage) {
	//	logger.info(`getCurrentLanguage: Using registration school language="${registrationLanguage}" for schoolId="${registrationSchoolId}"`);
	//	return registrationLanguage;
	//}

	//if (req?.url?.startsWith('/login')) {
	//	logger.info(`getCurrentLanguage: URL starts with /login, checking browser language`);
	//	const browserLanguage = getBrowserLanguage(req);
	//	if (browserLanguage) {
	//		logger.info(`getCurrentLanguage: Using browser language="${browserLanguage}"`);
	//		return browserLanguage;
	//	}
	//}

	//logger.info(`getCurrentLanguage: Using default language="${defaultLanguage}"`);
	return defaultLanguage;
};

const getInstance = () => (key, options = {}) => i18next.t(key, {
	...options,
});

const changeLanguage = async (langAttribute) => {
	const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown caller';

	if (availableLanguages.includes(langAttribute)) {
		logger.info(`changeLanguage: Changing to language="${langAttribute}", called from ${caller}`);
		const momentOptions = momentHelper.selectMomentOptions(langAttribute);
		i18nMoment.locale(langAttribute, momentOptions);
		if (langAttribute === 'de') {
			logger.info(`changeLanguage: Applying German locale customization for language="${langAttribute}"`);
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
	logger.warn(`changeLanguage: language="${langAttribute}" is not available, available languages="${availableLanguages.join(', ')}", called from ${caller}`);
	return false;
};

module.exports = {
	i18next,
	defaultLanguage,
	fallbackLanguage,
	availableLanguages,
	getInstance,
	isAvailableLanguage,
	validateLanguage,
	changeLanguage,
	getCurrentLanguage,
	getBrowserLanguage,
	i18nMoment,
};
