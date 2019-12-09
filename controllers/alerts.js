const express = require('express');
const api = require('../api');

const router = express.Router();

router.get('/', async (req, res, next) => {
	const alert = await api(req).get('/alert');
	const contentType = req.headers['content-type'];
	if (Array.isArray(contentType) || !contentType.includes('application/json')) {
		res.redirect('/');
	}
	res.send(alert);
});

module.exports = router;
