const express = require('express');

const { version } = require('../package.json');
const {
	sha, branch, message, stat,
} = require('../helpers/version');

const { SHOW_VERSION } = require('../config/global');

const router = express.Router();

router.get('/', (req, res, next) => {
	if (!SHOW_VERSION) {
		return res.sendStatus(403);
	}
	const { birthtime } = stat;
	return res.json({
		sha, version, branch, message, birthtime,
	});
});

module.exports = router;
