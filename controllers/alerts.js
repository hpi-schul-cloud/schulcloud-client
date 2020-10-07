const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const api = require('../api');
const logger = require('../helpers/logger');

const router = express.Router();

router.get('/', (req, res, next) => {
	if (!Configuration.get('FEATURE_ALERTS_ENABLED')) {
		res.json([]);
	} else {
		api(req).get('/alert')
			.then((alert) => {
				res.json(alert);
			}).catch((err) => {
				logger.error(new Error('Can not get /alert', err));
				res.json([]);
			});
	}
});

module.exports = router;
