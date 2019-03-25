const express = require('express');

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

// secure routes
router.use(authHelper.authChecker);

router.post('/', function (req, res, next) {
	const {
		firstName, lastName, email, password, password_new
	} = req.body; // TODO: sanitize
	return api(req).patch(`/accounts/${res.locals.currentPayload.accountId}`, {
		json: {
			password_verification: password,
			password: password_new !== '' ? password_new : undefined,
		},
	}).then(() => api(req).patch(`/users/${res.locals.currentUser._id}`, {
		json: {
			firstName,
			lastName,
			email,
		},
	}).then(authHelper.populateCurrentUser.bind(this, req, res)).then((_) => {
		res.redirect('/account/');
	})).catch((err) => {
		req.session.notification = {
			type: 'danger',
			message: err.error.message,
		};
		res.redirect('/account/');
	});
});

router.get('/offline', (req, res, next) => {
	res.render('lib/offline', {
		title: 'Ooops, du bist offline',
		subtitle: 'Wir laden dir diese Seite sobald du wieder online bist. 😊',
	});
});

router.get('/', (req, res, next) => {
	const notification = res.locals.notification;
	if (process.env.NOTIFICATION_SERVICE_ENABLED) {
		api(req).get('/notification/configuration/notificationOptions')
			.then((notificationOptions) => {
				res.render('account/settings', {
					title: 'Dein Account',
					notificationOptions,
					notification,
					userId: res.locals.currentUser._id,
				});
			}).catch((err) => {
				res.render('account/settings', {
					title: 'Dein Account',
					notificationOptions: false,
					notification,
					userId: res.locals.currentUser._id,
				});
			});
	} else {
		res.render('account/settings', {
			title: 'Dein Account',
			notificationOptions: false,
			notification,
			userId: res.locals.currentUser._id,
		});
	}
});

// delete device
router.delete('/settings/device', (req, res, next) => {
	const { name, _id = '' } = req.body;

	api(req).delete(`/notification/devices/${_id}`).then((_) => {
		res.sendStatus(200);
	}).catch((err) => {
		res.status((err.statusCode || 500)).send(err);
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
	}).then(() => 'Präferenzen wurden aktualisiert!').catch(err => 'Es ist ein Fehler bei den Präferenzen aufgetreten!');
});

module.exports = router;
