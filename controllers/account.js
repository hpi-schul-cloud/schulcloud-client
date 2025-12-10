const express = require('express');

const api = require('../api');
const authHelper = require('../helpers/authentication');

const router = express.Router();

// secure routes
router.use(authHelper.authChecker);

router.post('/', async (req, res) => {
	const {
		firstName,
		lastName,
		email,
		password,
		passwordNew,
	} = req.body;
	// validation
	if ((passwordNew || email) && !password) {
		const error = new Error(res.$t('account.error.text.currentPasswordRequired'));
		error.status = 401;
		throw error;
	}

	try {
		await api(req, { json: true, version: 'v3' }).patch('/account/me', {
			json: {
				passwordOld: password,
				passwordNew: passwordNew !== '' ? passwordNew : undefined,
				firstName,
				lastName,
				email,
			},
		});

		res.locals.currentUser = null; 		// necessary to trigger reloading of user in populateCurrentUser()
		await authHelper.populateCurrentUser(req, res);
		const isSSO = Boolean(res.locals.currentPayload.systemId);
		const isDiscoverable = res.locals.currentUser.discoverable;
		res.render('account/settings', {
			title: res.$t('account.headline.yourAccount'),
			pageTitle: res.$t('lib.loggedin.tab_label.settings'),
			notification: {
				type: 'success',
				message: res.$t('administration.controller.text.changesSuccessfullySaved'),
			},
			userId: res.locals.currentUser._id,
			sso: isSSO,
			isDiscoverable,
		});
	} catch (err) {
		res.render('account/settings', {
			title: res.$t('account.headline.yourAccount'),
			pageTitle: res.$t('lib.loggedin.tab_label.settings'),
			notification: {
				type: 'danger',
				message: err.error.message,
			},
		});
	}
});

router.get('/', (req, res, next) => {
	const isSSO = Boolean(res.locals.currentPayload.systemId);
	const isDiscoverable = res.locals.currentUser.discoverable;
	api(req).get(`/oauth2/auth/sessions/consent/${res.locals.currentUser._id}`).then(([session]) => {
		res.render('account/settings', {
			title: res.$t('account.headline.yourAccount'),
			pageTitle: res.$t('lib.loggedin.tab_label.settings'),
			session,
			userId: res.locals.currentUser._id,
			sso: isSSO,
			isDiscoverable,
		});
	}).catch(() => {
		res.render('account/settings', {
			title: res.$t('account.headline.yourAccount'),
			pageTitle: res.$t('lib.loggedin.tab_label.settings'),
			userId: res.locals.currentUser._id,
			sso: isSSO,
			isDiscoverable,
		});
	});
});

router.get('/teams/', (req, res, next) => {
	const isDiscoverable = res.locals.currentUser.discoverable;

	res.render('account/teams', {
		title: res.$t('account.teams.headline.teamSettings'),
		userId: res.locals.currentUser._id,
		isDiscoverable,
	});
});

router.get('/thirdPartyProviders/', async (req, res, next) => {
	let session;

	try {
		session = await api(req).get(`/oauth2/auth/sessions/consent/${res.locals.currentUser._id}`);
	} catch (e) {
		session = null;
	}

	res.render('account/thirdPartyProviders', {
		title: res.$t('account.thirdPartyProviders.headline.thirdPartyProviderLogin'),
		userId: res.locals.currentUser._id,
		session,
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
	}).then(() => res.$t('account.text.preferencesUpdated'))
		.catch(() => res.$t('account.text.preferencesUpdateError'));
});

router.post('/teamSettings', (req, res) => {
	let discoverable = null;
	if (req.body.discoverable === 'true') {
		discoverable = true;
	}
	if (req.body.discoverable === 'false') {
		discoverable = false;
	}
	return api(req).patch(`/users/${res.locals.currentUser._id}`, {
		json: {
			discoverable,
		},
	})
		.then(authHelper.populateCurrentUser.bind(this, req, res)).then(() => {
			res.redirect('/account/');
		})
		.catch((err) => {
			res.render('account/settings', {
				title: res.$t('account.headline.yourAccount'),
				pageTitle: res.$t('lib.loggedin.tab_label.settings'),
				notification: {
					type: 'danger',
					message: err.error.message,
				},
			});
		});
});

module.exports = router;
