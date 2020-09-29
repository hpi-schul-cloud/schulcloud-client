const { TimesHelper } = require('../helpers/TimesHelper');

const middleware = async (req, res, next) => {
	const { currentSchoolData } = (res || {}).locals;

	res.locals.currentTimezone = 'Europe/Berlin';
	if (currentSchoolData && currentSchoolData.timezone) {
		res.locals.currentTimezone = currentSchoolData.timezone;
	}

	res.$TimesHelper = new TimesHelper(res.locals.currentTimezone);

	return next();
};


module.exports = middleware;
