const express = require('express');

const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

router.get('/:scopeName/:id', (req, res, next) => {
	const { scopeName, id } = req.params;
	if (!scopeName || !id) {
		return res.send(400);
	}
	return authHelper.isAuthenticated(req).then(() => api(req)
		.post('/videoconference', { json: { scopeName, id } }))
		.then(login => res.redirect(login.url))
		.catch(err => next(err));
});

module.exports = router;
