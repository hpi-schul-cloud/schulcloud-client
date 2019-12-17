const express = require('express');

const api = require('../api');
const authHelper = require('../helpers/authentication');

const router = express.Router();

// secure routes
router.use(authHelper.authChecker);

router.post('/', (req, res) => {
	const {
		firstName,
		lastName,
		email,
		password,
		passwordNew,
	} = req.body;
	const discoverable = !!req.body.discoverable;
	return api(req).patch(`/accounts/${res.locals.currentPayload.accountId}`, {
		json: {
			password_verification: password,
			password: passwordNew !== '' ? passwordNew : undefined,
		}
	}).then(() => {
		return api(req).patch(`/users/${res.locals.currentUser._id}`, {
			json: {
				firstName,
				lastName,
				email,
				discoverable,
			},
		}).then(authHelper.populateCurrentUser.bind(this, req, res)).then(() => {
			res.redirect('/account/');
		});
	}).catch((err) => {
		res.render('account/settings', {
			title: 'Dein Account',
			notification: {
				type: 'danger',
				message: err.error.message,
			},
		});
	});
});

router.get('/', (req, res, next) => {
	const isSSO = Boolean(res.locals.currentPayload.systemId);
	const isDiscoverable = res.locals.currentUser.discoverable;
	const hideVisibilitySettings = (res.locals.currentRole === 'Schüler' || process.env.IGNORE_DISCOVERABILITY);
	Promise.all([
		api(req).get(`/oauth2/auth/sessions/consent/${res.locals.currentUser._id}`),
		(process.env.NOTIFICATION_SERVICE_ENABLED ? api(req).get('/notification/devices') : null),
	]).then(([session, device]) => {
		if (device) {
			device.map((d) => {
				if (d.token === req.cookies.deviceToken) {
					Object.assign(d, { selected: true });
				}
				return d;
			});
		}

		res.render('account/settings', {
			title: 'Dein Account',
			device,
			session,
			userId: res.locals.currentUser._id,
			sso: isSSO,
			hideVisibilitySettings,
			isDiscoverable,
		});
	}).catch(() => {
		res.render('account/settings', {
			title: 'Dein Account',
			userId: res.locals.currentUser._id,
			sso: isSSO,
			hideVisibilitySettings,
			isDiscoverable,
		});
	});
});

// delete file
router.delete('/settings/device', (req, res, next) => {
	const { _id = '' } = req.body;

	api(req).delete(`/notification/devices/${_id}`).then(() => {
		res.sendStatus(200);
	}).catch((err) => {
		res.status((err.statusCode || 500)).send(err);
	});
});

// revoke oauth2 session
router.get('/oauth2/revoke/:client', (req, res, next) => {
	api(req).delete(`/oauth2/auth/sessions/consent/${res.locals.currentUser._id}?client=${req.params.client}`)
		.then(() => {
			res.redirect('/account');
		}).catch((err) => {
			res.send(err);
		});
});

router.get('/user', (req, res, next) => {
	res.locals.currentUser.schoolName = res.locals.currentSchoolData.name;
	res.json(res.locals.currentUser);
});

router.post('/preferences', (req, res, next) => {
	const { attribute } = req.body;

	return api(req).patch(`/users/${res.locals.currentUser._id}`, {
		json: { [`preferences.${attribute.key}`]: attribute.value },
	}).then(() => 'Präferenzen wurden aktualisiert!')
		.catch(() => 'Es ist ein Fehler bei den Präferenzen aufgetreten!');
});

router.post('/ttl', (req, res, next) => {
	if (req.body.resetTimer) {
		api(req).post('/accounts/jwtTimer')
			.then(result => res.sendStatus(200))
			.catch(() => res.status(500).send('Could not update remaining session time'));
	} else {
		api(req).get('/accounts/jwtTimer')
			.then(result => res.send(result))
			.catch(() => res.status(500).send('Could not get remaining session time'));
	}
});


module.exports = router;
