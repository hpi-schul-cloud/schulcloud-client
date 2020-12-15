const rp = require('request-promise');
const { Configuration } = require('@hpi-schul-cloud/commons');

if (Configuration.has('REQUEST_TIMEOUT_MS') !== true) {
	throw new Error('REQUEST_TIMEOUT_MS missing in Configuration');
}

const xApiKey = Configuration.get('API_KEY');
const timeout = Configuration.get('REQUEST_TIMEOUT_MS');
const api = (baseUrl, { keepAlive = false } = {}) => (req, { json = true } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (keepAlive) {
		headers.Connection = 'Keep-Alive';
	}
	headers['x-api-key'] = xApiKey; // TODO: move to api.js that is no part that should send to the editor
	if (json === true) {
		headers['Content-Type'] = 'application/json';
	}
	return rp.defaults({
		baseUrl,
		timeout,
		json,
		headers,
	});
};

module.exports = api;
