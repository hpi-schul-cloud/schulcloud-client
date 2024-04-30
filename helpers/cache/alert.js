const api = require('../../api');
const Cache = require('./Cache');

const getAlerts = async (req) => api(req, { version: 'v3' }).get('/alert');

const AlertsCache = new Cache(getAlerts, { updateIntervalSecounds: 60 });

module.exports = {
	AlertsCache,
};
