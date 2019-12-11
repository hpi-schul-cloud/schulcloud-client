const rp = require('request-promise');

const baseUrl = process.env.EDITOR_URL || 'http://localhost:4001';
const { KEEP_ALIVE } = process.env;

const api = (req, { json = true } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (KEEP_ALIVE) {
		headers.Connection = 'Keep-Alive';
	}

	return rp.defaults({
		baseUrl,
		json,
		headers,
	});
};

module.exports = api;
