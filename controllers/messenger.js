const express = require('express');

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);

router.get('/token', (req, res, next) => api(req)
	.post('/messengerToken', {})
	.then((result) => res.send(result))
	.catch((e) => {
		// eslint-disable-next-line no-console
		console.error('Failed to get messengerToken', e.error);
		const error = new Error('Messenger Token nicht verfügbar.');
		error.status = 404;
		return next(error);
	}));

module.exports = router;
