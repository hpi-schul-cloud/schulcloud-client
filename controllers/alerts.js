const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const api = require('../api');
const logger = require('../helpers/logger');

const router = express.Router();

let handler = (req, res) => {
	res.json([]);
};
if (Configuration.get('FEATURE_ALERTS_ENABLED')) {
	handler = (req, res) => api(req).get('/alert')
		.then((alert) => {
			res.json(alert);
		}).catch((err) => {
			logger.error(new Error('Can not get /alert', err));
			res.json([]);
		});
}
router.get('/', handler);

module.exports = router;
