const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const asyncWrapper = require('../middleware/asyncMiddlewareWrapper');
const api = require('../api');
const logger = require('../helpers/logger');

const router = express.Router();

router.get('/', asyncWrapper(async (req, res, next) => {
	let alert;

	if (Configuration.get('FEATURE_ALERTS_ENABLED')) {
		alert = await api(req).get('/alert');
	} else {
		alert = [];
	}
	return res.json(alert);
}));

module.exports = router;
