const rp = require('request-promise');
const { Configuration } = require('@schul-cloud/commons');

if (Configuration.has('REQUEST_TIMEOUT_MS') !== true) {
	throw new Error('REQUEST_TIMEOUT_MS missing in Configuration');
}

const api = (baseUrl, { keepAlive = false } = {}) => (req, { json = true } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (keepAlive) {
		headers.Connection = 'Keep-Alive';
	}
	headers['x-api-key'] = Configuration.get('API_KEY');
	if (json === true) {
		headers['Content-Type'] = 'application/json';
	}
	return rp.defaults({
		baseUrl,
		timeout: Configuration.get('REQUEST_TIMEOUT_MS'),
		json,
		headers,
	});
};

module.exports = api;
