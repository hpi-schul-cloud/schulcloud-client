const express = require('express');

const router = express.Router();

const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	res.render('addons/addons', {
		title: res.$t("addons.headline.addons"),
	});
});

module.exports = router;
