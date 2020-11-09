const express = require('express');

const { Configuration } = require('@schul-cloud/commons');
const { version } = require('../package.json');
const {
	sha, branch, message, stat,
} = require('../helpers/version');


const router = express.Router();

router.get('/', (req, res, next) => {
	if (Configuration.get('FEATURE_SHOW_VERSION_ENABLED') !== true) {
		return res.sendStatus(403);
	}
	const { birthtime } = stat;
	return res.json({
		sha, version, branch, message, birthtime,
	});
});

module.exports = router;
