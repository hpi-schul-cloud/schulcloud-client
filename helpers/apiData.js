const api = require('../api');

/* @deprecated */
const getAllPaginatedData = async (req, service, qs) => {
	delete qs.$limit;
	let data = await api(req).get(service, { qs });
	let results = data.data;
	qs.$skip = data.skip;
	qs.$limit = data.limit;
	while (qs.$limit + qs.$skip < data.total) {
		qs.$skip += data.limit;
		data = await api(req).get(service, { qs });
		results = [...results, ...data.data];
	}
	return results;
};

/* stop using $limit=false. It does not disable pagination */
const getApiData = async (req, service, qs) => {
	/* @deprecated */
	if (qs.$limit === false || qs.$limit === -1) {
		return getAllPaginatedData(req, service, qs);
	}
	const result = await api(req).get(service, { qs });
	return result.data;
};

module.exports = {
	getApiData,
};
