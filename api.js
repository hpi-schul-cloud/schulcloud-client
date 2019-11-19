const request = require('request');
const rp = require('request-promise');

const api = (req, { useCallback = false, json = true, backend = 'server' } = {}) => {
	const headers = {};
	if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}
	if (process.env.KEEP_ALIVE) {
		headers.Connection = 'Keep-Alive';
	}

	const handler = useCallback ? request : rp;

	let baseUrl;
	switch (backend) {
		case 'editor':
			baseUrl = process.env.EDITOR_URL || 'http://localhost:4001';
			break;
		case 'server':
		default:
			baseUrl = process.env.BACKEND_URL || 'http://localhost:3030/';
	}

	return handler.defaults({
		baseUrl,
		json,
		headers,
	});
};

module.exports = api;
