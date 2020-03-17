const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');

router.get('/', (req, res, next) => {
	const { href, display, target } = req.query;
	return authHelper.isAuthenticated(req)
		.then(response => res.render('lib/redirect', {
			href,
			display: display | "eine externe Seite",
			target: target | undefined
		}))
		.catch(err => next(err));
});

module.exports = router;