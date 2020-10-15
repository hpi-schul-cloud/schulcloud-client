const { setDefaultTimezone } = require('../helpers/timesHelper');

const middleware = async (req, res, next) => {
	// detect and set timezone of school
	setDefaultTimezone(req, res);
	return next();
};

module.exports = middleware;
