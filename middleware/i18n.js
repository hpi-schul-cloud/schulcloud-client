const { getInstance, getUserLanguage } = require('../helpers/i18n');

const middleware = (req, res, next) => {
	res.locals.userLanguage = getUserLanguage(res.locals.currentUser);
	res.$t = getInstance(res.locals.currentUser);
	return next();
};

module.exports = middleware;
