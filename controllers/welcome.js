const express = require('express');

const router = express.Router();

const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	res.render('firstLogin/welcome', {});
});

module.exports = router;
