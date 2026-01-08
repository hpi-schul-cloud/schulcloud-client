const axios = require('axios');

const mapError = (err) => {
	// We map to the error interface that was previously used with request-promise.
	const mappedError = {
		name: err.name,
		statusCode: err.status,
		message: err.message,
		error: err.response?.data,
		options: {
			baseUrl: err.config?.baseURL,
			method: err.config?.method,
			qs: err.config?.params,
			timeout: err.config?.timeout,
			uri: err.config?.url,
		},
		stack: err.stack,
	};

	return mappedError;
};

const mapOptions = (method, url, options) => {
	const mappedOptions = { method, url, ...options };

	if ('json' in mappedOptions) {
		mappedOptions.data = mappedOptions.json;
		delete mappedOptions.json;
	}

	if ('qs' in mappedOptions) {
		mappedOptions.params = mappedOptions.qs;
		delete mappedOptions.qs;
	}

	return mappedOptions;
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

	axiosInstance.interceptors.response.use((res) => res.data, (err) => {
		// The full AxiosError can contain critical information like the auth token. Thus we map it here.
		const mappedError = mapError(err);

		throw mappedError;
	});

	const methods = ['get', 'post', 'patch', 'put', 'delete'];

	const apiInstance = {};

	methods.forEach((method) => {
		apiInstance[method] = (url, options) => {
			// The api was initially built with request-promise and we'll keep its interface.
			// To use Axios we have to map the options.
			const mappedOptions = mapOptions(method, url, options);

			const methodHandler = axiosInstance.request(mappedOptions);

			return methodHandler;
		};
	});

	return apiInstance;
};

module.exports = api;
