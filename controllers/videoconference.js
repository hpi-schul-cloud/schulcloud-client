const express = require('express');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

const { HOST } = process.env;

router.get('/:scopeName/:scopeId', (req, res, next) => {
	const { scopeName, scopeId } = req.params;
	return authHelper.isAuthenticated(req).then(() => api(req)
		.get(`/videoconference/${scopeName}/${scopeId}?demo=wait`))
		.then(response => res.send(response))
		.catch(err => next(err));
});

router.post('/', (req, res, next) => {
	const { scopeName, scopeId, options = {} } = req.body;
	if (!options.filename) {
		options.filename = `${HOST}/other/pdf/bbb-default-presentation.pdf`;
	}
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
