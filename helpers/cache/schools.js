const api = require('../../api');
const Cache = require('./Cache');
const { logger, formatError } = require('..');

const getLoginSchools = async (req) => {
	let schools = [];
	try {
		schools = await api(req, { version: 'v3' }).get('/school/list-for-ldap-login');
	} catch (err) {
		logger.error('error getting schools', formatError(err));
	}
	return schools;
};

const LoginSchoolsCache = new Cache(getLoginSchools, { updateIntervalSecounds: 1800 });

module.exports = {
	LoginSchoolsCache,
};
