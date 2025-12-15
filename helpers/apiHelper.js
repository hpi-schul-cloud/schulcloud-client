const axios = require('axios');

// The api was initially built with request-promise and used its method signatures.
// To use axios we have to adapt the options.
const adaptOptions = (options) => {
	const adapted = { ...options };

	if ('json' in adapted) {
		adapted.data = adapted.json;
		delete adapted.json;
	} else if ('body' in adapted) {
		adapted.data = adapted.body;
		delete adapted.body;
	}

	if ('qs' in adapted) {
		adapted.params = adapted.qs;
		delete adapted.qs;
	}

	return adapted;
};

const api = (baseUrl, { keepAlive, xApiKey, timeout } = {}) => (req, { version = 'v1', accessToken } = {}) => {
	const headers = {};

	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`;
	} else if (req && req.cookies && req.cookies.jwt) {
		headers.Authorization = (req.cookies.jwt.startsWith('Bearer ') ? '' : 'Bearer ') + req.cookies.jwt;
	}

	if (keepAlive) {
		headers.Connection = 'Keep-Alive';
	}

	if (xApiKey) {
		headers['x-api-key'] = xApiKey;
	}

	const axiosInstance = axios.create({
		baseURL: new URL(version, baseUrl).href,
		timeout,
		headers,
	});

	axiosInstance.interceptors.response.use((res) => res.data);

	const methods = ['get', 'post', 'patch', 'put', 'delete'];

	const apiInstance = {};

	methods.forEach((method) => {
		apiInstance[method] = (url, options) => {
			const adaptedOptions = adaptOptions(options);

			let methodHandler;

			if (method === 'get' || method === 'delete') {
				methodHandler = axiosInstance[method](url, adaptedOptions);
			} else {
				methodHandler = axiosInstance[method](url, adaptedOptions.data, adaptedOptions);
			}

			return methodHandler;
		};
	});

	return apiInstance;
};

module.exports = api;
