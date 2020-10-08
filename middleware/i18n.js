const { Configuration } = require('@schul-cloud/commons');
const {
	getInstance,
	changeLanguage,
	getCurrentLanguage,
	getBrowserLanguage,
	defaultLanguage,
} = require('../helpers/i18n');

const middleware = async (req, res, next) => {
	res.$t = getInstance();

	const currentLanguage = await getCurrentLanguage(req, res);

	res.locals.userLanguage = currentLanguage;

	if (currentLanguage) {
		changeLanguage(currentLanguage);
		res.cookie('USER_LANG', currentLanguage, {
			expires: new Date(Date.now() + Configuration.get('COOKIE__EXPIRES_SECONDS')),
			httpOnly: Configuration.get('COOKIE__HTTP_ONLY'), // can't be set to true with nuxt client
			hostOnly: Configuration.get('COOKIE__HOST_ONLY'),
			sameSite: Configuration.get('COOKIE__SAME_SITE'), // restrict jwt access to our domain ressources only
			secure: Configuration.get('COOKIE__SECURE'),
		});

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
