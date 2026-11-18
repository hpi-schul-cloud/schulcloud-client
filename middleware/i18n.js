const {
	getInstance,
	changeLanguage,
	getCurrentLanguage,
	getBrowserLanguage,
	availableLanguages,
	validateLanguage,
} = require('../helpers/i18n');

const middleware = async (req, res, next) => {
	// TODO: Error handling is missing and throw async error messages
	// and can not set headers after they are sent to the client
	res.$t = getInstance();
	const currentLanguage = await getCurrentLanguage(req, res);
	const language = validateLanguage(
		currentLanguage ?? (req.url.startsWith('/login') ? getBrowserLanguage(req) : undefined),
	);

	res.locals.userLanguage = language;
	res.locals.availableLanguages = availableLanguages;
	await changeLanguage(language);

	return next();
};

module.exports = middleware;
