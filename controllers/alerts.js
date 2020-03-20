const express = require('express');
const api = require('../api');
const { FEATURE_ALERTRS_ENABLED } = require('../config/global');

const router = express.Router();

router.get('/', async (req, res, next) => {
	let alert;

	if (FEATURE_ALERTRS_ENABLED) {
		alert = await api(req).get('/alert');
	} else {
		alert = [];
	}
	return res.json(alert);
});

module.exports = router;
