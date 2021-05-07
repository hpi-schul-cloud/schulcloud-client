const api = require('../../api');
const Cache = require('./Cache');

const getLoginSchools = async (req) => {
	const schools = await api(req).get('/schoolsList');
	return schools;
};

const LoginSchoolsCache = new Cache(getLoginSchools, { updateIntervalSecounds: 1800 });

module.exports = {
	LoginSchoolsCache,
};
