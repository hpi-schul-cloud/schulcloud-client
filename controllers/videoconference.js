const express = require('express');

const sanitizeHtml = require('sanitize-html');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

router.get('/:scopeName/:scopeId', async (req, res, next) => {
	const { scopeName, scopeId } = req.params;
	if (!await authHelper.isAuthenticated(req, res)) {
		return res.sendStatus(401);
	}

	try {
		const response = await api(req, { version: 'v3' })
			.get(`/videoconference/${scopeName}/${scopeId}`);
		return res.send(response);
	} catch (error) {
		return res.status(error.statusCode).send(sanitizeHtml(error));
	}
});

router.post('/', async (req, res, next) => {
	const { scopeName, scopeId, options = {} } = req.body;
	if (!await authHelper.isAuthenticated(req, res)) {
		return res.sendStatus(401);
	}

	try {
		const response = await api(req, { version: 'v3' })
			.post(`/videoconference/${scopeName}/${scopeId}`, {
				json: options,
			});
		return res.send(response);
	} catch (error) {
		return res.status(error.statusCode).send(sanitizeHtml(error));
	}
});

module.exports = router;
