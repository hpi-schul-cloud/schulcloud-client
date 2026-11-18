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
	const currentLanguage = await getCurrentLanguage(req, res);

	res.locals.userLanguage = currentLanguage;
	res.locals.availableLanguages = availableLanguages;
	await changeLanguage(currentLanguage);

	return next();
};

module.exports = middleware;
