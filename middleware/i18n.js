const { setCookie } = require('../helpers/cookieHelper');
const {
	getInstance,
	changeLanguage,
	getCurrentLanguage,
	getBrowserLanguage,
	defaultLanguage,
} = require('../helpers/i18n');

const middleware = async (req, res, next) => {
	// TODO: Error handling is missing and throw async error messages
	// and can not set headers after they are sent to the client
	res.$t = getInstance();
	const currentLanguage = await getCurrentLanguage(req, res);

	res.locals.userLanguage = currentLanguage;

	if (currentLanguage) {
		changeLanguage(currentLanguage);
		setCookie(res, 'USER_LANG', currentLanguage);

		return next();
	}

	// get language by browser on login page
	if (req.url.startsWith('/login')) {
		const browserLanguage = getBrowserLanguage(req);
		if (browserLanguage) {
			changeLanguage(browserLanguage);
			return next();
		}
	}

	changeLanguage(defaultLanguage);

	return next();
};

module.exports = middleware;
