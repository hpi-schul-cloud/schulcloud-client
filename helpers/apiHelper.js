const rp = require('request-promise');

const api = (baseUrl, { keepAlive, xApiKey, timeout } = {}) => (req, { json = true, version = 'v1' } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (keepAlive) {
		headers.Connection = 'Keep-Alive';
	}
	if (xApiKey) {
		headers['x-api-key'] = xApiKey;
	}
	if (json === true) {
		headers['Content-Type'] = 'application/json';
	}
	return rp.defaults({
		baseUrl: new URL(version, baseUrl).href,
		timeout,
		json,
		headers,
	});
};

module.exports = api;
