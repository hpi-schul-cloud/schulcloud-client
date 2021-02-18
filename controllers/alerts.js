const express = require('express');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../api');
const { logger, formatError } = require('../helpers');

const router = express.Router();

let handler = (req, res) => {
	res.json([]);
};
if (Configuration.get('FEATURE_ALERTS_ENABLED')) {
	handler = (req, res) => api(req).get('/alert')
		.then((alert) => {
			res.json(alert);
		}).catch((err) => {
			logger.error(new Error('Can not get /alert', formatError(err)));
			res.json([]);
		});
}
router.get('/', handler);

module.exports = router;
