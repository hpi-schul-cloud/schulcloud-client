const express = require('express');

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);

router.get('/token', (req, res, next) => api(req, { timeout: 16000 })
	.post('/messengerToken', {})
	.then((result) => res.send(result))
	.catch(next));

module.exports = router;
