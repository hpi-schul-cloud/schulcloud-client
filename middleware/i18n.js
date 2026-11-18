const {
	getInstance,
	changeLanguage,
	getCurrentLanguage,
	availableLanguages,
} = require('../helpers/i18n');

const middleware = async (req, res, next) => {
	// TODO: Error handling is missing and throw async error messages
	// and can not set headers after they are sent to the client
	res.$t = getInstance();
	const language = await getCurrentLanguage(req, res);

	res.locals.userLanguage = language;
	res.locals.availableLanguages = availableLanguages;
	await changeLanguage(language);

	return next();
};

module.exports = middleware;
