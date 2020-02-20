const express = require('express');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

const { HOST } = process.env;

router.get('/:scopeName/:scopeId', (req, res, next) => {
	const { scopeName, scopeId } = req.params;
	return authHelper.isAuthenticated(req).then(() => api(req)
		.get(`/videoconference/${scopeName}/${scopeId}`))
		.then(response => res.send(response))
		.catch(err => next(err));
});

router.post('/', (req, res, next) => {
	const { scopeName, scopeId, options = {} } = req.body;
	return authHelper.isAuthenticated(req).then(() => api(req)
		.post('/videoconference', {
			body: {
				scopeName, scopeId, options,
			},
		}))
		.then(response => res.send(response))
		.catch(err => next(err));
});

module.exports = router;
