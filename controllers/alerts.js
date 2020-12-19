const express = require('express');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../api');
const logger = require('../helpers/logger');

const router = express.Router();

let handler = (req, res) => {
	res.set('Cache-Control', 'public, max-age=3600');
	res.json([]);
};
if (Configuration.get('FEATURE_ALERTS_ENABLED')) {
	handler = (req, res) => api(req).get('/alert')
		.then((alert) => {
			res.set('Cache-Control', 'public, max-age=120');
			res.json(alert);
			}).catch((err) => {
			logger.error(new Error('Can not get /alert', err));
			res.set('Cache-Control', 'public, max-age=60');
			res.json([]);
		});
}
router.get('/', handler);

module.exports = router;
