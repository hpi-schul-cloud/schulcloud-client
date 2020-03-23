const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const api = require('../api');

const router = express.Router();

router.get('/', async (req, res, next) => {
	let alert;

	if (Configuration.get('FEATURE_ALERTRS_ENABLED')) {
		alert = await api(req).get('/alert');
	} else {
		alert = [];
	}
	return res.json(alert);
});

module.exports = router;
