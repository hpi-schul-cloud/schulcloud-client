/*
 * One Controller per layout view
 */

const express = require('express');
const api = require('../../api');
const authHelper = require('../../helpers/authentication');

const router = express.Router();

router.use(authHelper.authChecker);


router.get('/webuntis/edit', (req, res, next) => {
	res.render('administration/datasources/webuntis-edit', {
		title: 'WebUntis bearbeiten',
		action: '/administration/datasources/webuntis/edit',
	});
});
router.post('/webuntis/edit', (req, res, next) => {
	if (!req.body.endpoint) {
		req.body.endpoint = 'erato.webuntis.com';
	}
	console.log('BODY:', req.body);
	res.redirect('/administration/datasources/webuntis');
});


router.post('/webuntis', (req, res, next) => {
	console.log('BODY:', req.body);
	res.redirect('/administration/datasources/webuntis');
});
router.get('/webuntis', (req, res, next) => {
	res.render('administration/datasources/webuntis', {
		title: 'WebUntis',
		action: '/administration/datasources/webuntis',
		hasLoginData: !!(new Date().getSeconds() % 2),
	});
});
router.get('/', (req, res, next) => {
	res.render('administration/datasources/overview', {
		title: 'Datenquellen',
	});
});


module.exports = router;
