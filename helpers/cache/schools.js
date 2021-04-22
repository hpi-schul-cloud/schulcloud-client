const { getAllPaginatedData } = require('../apiData');
const Cache = require('./Cache');

const getLoginSchools = async (req) => {
	const qs = {
		purpose: { $ne: 'expert' },
		$limit: false,
		$sort: 'name',
		$select: ['name', 'systems'],
	};

	const schools = await getAllPaginatedData(req, '/schools', qs);
	return schools;
};

const LoginSchoolsCache = new Cache(getLoginSchools, { updateIntervalSecounds: 60 });

module.exports = {
	LoginSchoolsCache,
};
