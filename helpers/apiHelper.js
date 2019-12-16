const rp = require('request-promise');
const { REQUEST_TIMEOUT } = require('../config/global');

const api = (baseUrl, { keepAlive = false } = {}) => (req, { json = true } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (keepAlive) {
		headers.Connection = 'Keep-Alive';
	}

	return rp.defaults({
		baseUrl,
		timeout: REQUEST_TIMEOUT,
		json,
		headers,
	});
};

module.exports = api;
