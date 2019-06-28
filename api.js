const request = require('request');
const rp = require('request-promise');

const api = (req, { useCallback = false, json = true } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (process.env.KEEP_ALIVE) {
		headers.Connection = 'Keep-Alive';
	}

	const handler = useCallback ? request : rp;
	return handler.defaults({
		baseUrl: process.env.BACKEND_URL || 'http://localhost:3030/',
		json,
		headers,
	});
};

module.exports = api;
