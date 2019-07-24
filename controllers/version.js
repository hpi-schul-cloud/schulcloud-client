const express = require('express');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const { version } = require('../package.json');

const router = express.Router();

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

router.get('/', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}
	let sha = false;
	try {
		sha = fs.readFileSync(path.join(__dirname, '..', 'version'), 'utf8').trim();
	} catch (error) {
		logger.error('version file missing', error);
	}
	return res.json({ sha, version });
});

module.exports = router;
