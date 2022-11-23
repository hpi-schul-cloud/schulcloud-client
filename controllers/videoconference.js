const express = require('express');

const sanitizeHtml = require('sanitize-html');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

router.get('/:scopeName/:scopeId', (req, res, next) => {
	const { scopeName, scopeId } = req.params;
	return authHelper.isAuthenticated(req).then(() => api(req, { version: 'v3' })
		.get(`/videoconference/${scopeName}/${scopeId}`))
		.then((response) => res.send(response))
		.catch((error) => res.status(error.statusCode).send(sanitizeHtml(error)));
});

router.post('/', (req, res, next) => {
	const { scopeName, scopeId, options = {} } = req.body;
	return authHelper.isAuthenticated(req).then(() => api(req, { version: 'v3' })
		.post(`/videoconference/${scopeName}/${scopeId}`, {
			body: options,
		}))
		.then((response) => res.send(response))
		.catch((error) => res.status(error.statusCode).send(sanitizeHtml(error)));
});

module.exports = router;
