const api = require('../../api');
const Cache = require('./Cache');

const getLoginSchools = async (req) => {
	const qs = {
		purpose: { $ne: 'expert' },
		$limit: false,
		$sort: 'name',
		// $select
	};

	const schools = await api(req).get('schools', { qs });
	return schools.data;
};

const withCache = new Cache(getLoginSchools, { updateInvervalSecounds: 60 });

module.exports = {
	getLoginSchools: withCache.get,
};
