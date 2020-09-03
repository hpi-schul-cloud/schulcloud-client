const { getInstance, changeLanguage, getCurrentLanguage } = require('../helpers/i18n');

const middleware = async (req, res, next) => {
	const currentLanguage = await getCurrentLanguage(req, res);
	if (currentLanguage) {
		changeLanguage(currentLanguage);
		res.cookie('USER_LANG', currentLanguage);
	}

	res.$t = getInstance();
	return next();
};

module.exports = middleware;
