const express = require('express');
const api = require('../api');
const authHelper = require('../helpers/authentication');

const router = express.Router();

router.use(authHelper.authChecker);

router.get('/', async (req, res) => {
	if (!res.locals.currentUser.forcePasswordChange) {
		return res.redirect('dashboard');
	}
	const renderObject = {
		title: 'Bitte ändern sie ihr passwort',
		hideMenu: true,
	};
	return res.render('firstLogin/forcePasswordChange', renderObject);
});

router.post('/submit', async (req, res) => api(req, { json: true, version: 'v3' })
	.patch('/account/me/password', {
		json: {
			password: req.body['password-1'],
			confirmPassword: req.body['password-2'],
		},
	})
	.then(() => {
		res.sendStatus(200);
	})
	.catch((err) => {
		res.status(500)
			.send(
				(err.error || err).message
					|| 'Ein Fehler ist bei der Verarbeitung der Force Change Password Daten aufgetreten.',
			);
	}));

module.exports = router;
