const api = require('../api');
const authHelper = require('./authentication');

const getConsentVersion = async (req, res, consentType) => {
	const isAuthenticated = await authHelper.isAuthenticated(req);
	const qs = {
		$limit: 1,
		consentTypes: [consentType],
		$sort: {
			publishedAt: -1,
		},
	};

	if (isAuthenticated && res.locals.currentSchool) {
		qs.schoolId = res.locals.currentSchool;
	}

	const consentVersion = await api(req).get('/consentVersions', { qs });
	return consentVersion;
};

module.exports = {
	getConsentVersion,
};
