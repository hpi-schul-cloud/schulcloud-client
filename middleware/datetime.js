const { setDefaultTimezone, setDefaultFormats } = require('../helpers/timesHelper');

const middleware = async (req, res, next) => {
	// detect and set timezone of school
	setDefaultTimezone(req, res);
	setDefaultFormats(res);
	return next();
};

module.exports = middleware;
