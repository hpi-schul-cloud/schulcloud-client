const api = require('../../api');
const Cache = require('./Cache');

const getLoginSchools = async (req) => {
	const qs = {
		purpose: { $ne: 'expert' },
		$limit: false,
		$sort: 'name',
		$select: ['name', 'systems'],
	};

	const schools = await api(req).get('schools', { qs });
	return schools.data;
};

const LoginSchoolsCache = new Cache(getLoginSchools, { updateIntervalSecounds: 60 });

module.exports = {
	LoginSchoolsCache,
};
