/*
 * WebUntis specific views
 */

const express = require('express');
const api = require('../../../api');
const authHelper = require('../../../helpers/authentication');

const router = express.Router();

router.use(authHelper.authChecker);

router.get('/run/:id', async (req, res, next) => {
	res.render('administration/datasources/WebUntis/run', {
		title: "WebUntis import",
		breadcrumb: [
			{
				title: 'Datenquellen',
				url: '/administration/datasources',
			},
		],
	});
});

module.exports = router;
