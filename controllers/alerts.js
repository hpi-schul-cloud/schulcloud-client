const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const api = require('../api');
const logger = require('../helpers/logger');

const router = express.Router();

let handler = (req, res) => {
	res.send(200).json([]);
};
if (Configuration.get('FEATURE_ALERTS_ENABLED')) {
	handler = (req, res) => api(req).get('/alert')
		.then((alert) => {
			res.send(200).json(alert);
		}).catch((err) => {
			logger.error(new Error('Can not get /alert', err));
			res.send(200).json([]);
		});
}
router.get('/', handler);

module.exports = router;
