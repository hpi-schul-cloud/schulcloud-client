const express = require('express');
const api = require('../api');

const router = express.Router();

router.get('/', async (req, res, next) => {
	const alert = await api(req).get('/alert');
	return res.json(alert);
});

module.exports = router;
