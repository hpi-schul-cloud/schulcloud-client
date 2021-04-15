const api = require('../../api');
const Cache = require('./Cache');

const getAlerts = async (req) => api(req).get('/alert');

const AlertsCache = new Cache(getAlerts, { updateInvervalSecounds: 60 });

module.exports = {
	AlertsCache,
};
