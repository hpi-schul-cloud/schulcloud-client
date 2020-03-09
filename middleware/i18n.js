const { getInstance } = require('../helpers/i18n');

const middleware = (req, res, next) => {
	res.$t = getInstance(res.locals.currentUser);
	return next();
};

module.exports = middleware;
