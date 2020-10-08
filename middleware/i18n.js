const {
	getInstance,
	changeLanguage,
	getCurrentLanguage,
	getBrowserLanguage,
	defaultLanguage,
} = require('../helpers/i18n');

const { setDefaultTimezone } = require('../helpers/timesHelper');

const middleware = async (req, res, next) => {
	res.$t = getInstance();

	// detect and set timezone of school
	setDefaultTimezone(req, res);

	const currentLanguage = await getCurrentLanguage(req, res);

	res.locals.userLanguage = currentLanguage;

	if (currentLanguage) {
		changeLanguage(currentLanguage);
		res.cookie('USER_LANG', currentLanguage);
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
