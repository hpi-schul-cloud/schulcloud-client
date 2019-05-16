/*
 * One Controller per layout view
 */

const express = require('express');

const router = express.Router();
const api = require('../api');
const feedr = require('feedr').create();
const authHelper = require('../helpers/authentication');
const userConsentVersions = require('../helpers/consentVersions');


const getSelectOptions = (req, service, query) => api(req).get(`/${service}`, {
	qs: query,
}).then(data => data.data);


// Login

router.post('/login/', (req, res, next) => {
	const username = req.body.username; // TODO: sanitize
	const password = req.body.password; // TODO: sanitize
	const systemId = req.body.systemId;
	const schoolId = req.body.schoolId;

	return api(req).get('/accounts/', { qs: { username } })
		.then((account) => {
			if (!(account[0] || {}).activated && (account[0] || {}).activated !== undefined) { // undefined for currently existing users
				res.locals.notification = {
					type: 'danger',
					message: 'Account noch nicht aktiviert.',
				};
				next();
			} else {
				const login = data => api(req).post('/authentication', { json: data }).then((data) => {
					res.cookie('jwt', data.accessToken,
						Object.assign({},
							{ expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
							authHelper.cookieDomain(res)));
					res.redirect('/login/success/');
				}).catch((_) => {
					res.locals.notification = {
						type: 'danger',
						message: 'Login fehlgeschlagen.',
					};
					next();
				});

				if (systemId) {
					return api(req).get(`/systems/${req.body.systemId}`).then(system => login({
						strategy: system.type, username, password, systemId, schoolId,
					}));
				}
				return login({ strategy: 'local', username, password });
			}
		});
});


router.all('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return res.redirect('/login/success/');
		}
		feedr.readFeed('https://blog.schul-cloud.org/rss', {
			requestOptions: { timeout: 2000 },
		}, (err, data, headers) => {
			let blogFeed = [];
			try {
				blogFeed = data.rss.channel[0].item.slice(0, 5).map((e) => {
					const date = new Date(e.pubDate);


					const locale = 'en-us';


					const month = date.toLocaleString(locale, { month: 'long' });
					e.pubDate = `${date.getDate()}. ${month}`;
					return e;
				});
			} catch (e) {
				// just catching the blog-error
			}
			const schoolsPromise = getSelectOptions(req, 'schools', { purpose: { $ne: 'expert' }, $limit: false, $sort: 'name' });
			Promise.all([
				schoolsPromise,
			]).then(([schools, systems]) => res.render('authentication/home', {
				schools,
				blogFeed,
				inline: true,
				systems: [],
			}));
		});
	});
});

router.all('/login/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return res.redirect('/login/success/');
		}
		const schoolsPromise = getSelectOptions(req, 'schools', { purpose: { $ne: 'expert' }, $limit: false, $sort: 'name' });
		Promise.all([
			schoolsPromise,
		]).then(([schools, systems]) => res.render('authentication/login', {
			schools,
			inline: true,
			systems: [],
		}));
	});
});

const ssoSchoolData = (req, accountId) => api(req).get(`/accounts/${accountId}`).then(account => api(req).get('/schools/', {
	qs: {
		systems: account.systemId,
	},
}).then((schools) => {
	if (schools.data.length > 0) {
		return schools.data[0];
	}
	return undefined;
}).catch(err => undefined)).catch(err => undefined);
// so we can do proper redirecting and stuff :)
router.get('/login/success', authHelper.authChecker, (req, res, next) => {
	if (res.locals.currentUser) {
		const user = res.locals.currentUser;
		api(req).get('/consents/', { qs: { userId: user._id } })
			.then((consents) => {
				if (consents.data.length === 0) {
					// user has no consent; create one and try again to get the proper redirect.
					return api(req).post('/consents/', { json: { userId: user._id } })
						.then((_) => {
							res.redirect('/login/success');
						});
				}
				const consent = consents.data[0];
				// check consent versions
				userConsentVersions(res.locals.currentUser, consent, req).then((consentUpdates) => {
					if (consent.access && !consentUpdates.haveBeenUpdated) {
						return res.redirect('/dashboard');
					}
					// make sure fistLogin flag is not set
					return res.redirect('/firstLogin');
				});
			});
	} else {
		// if this happens: SSO
		const accountId = (res.locals.currentPayload || {}).accountId;

		ssoSchoolData(req, accountId).then((school) => {
			if (school == undefined) {
				res.redirect('/dashboard/');
			} else {
				res.redirect(`/registration/${school._id}/sso/${accountId}`);
			}
		});
	}
});

router.get('/login/systems/:schoolId', (req, res, next) => {
	api(req).get(
		`/schools/${req.params.schoolId}`,
		{
			qs: { $populate: ['systems'] },
		},
	).then((data) => {
		const systems = data.systems.filter(value => value.type !== 'ldap' || value.ldapConfig.active === true);
		return res.send(systems);
	});
});

router.get('/logout/', (req, res, next) => {
	api(req).del('/authentication')
		.then((_) => {
			res.clearCookie('jwt', authHelper.cookieDomain(res));
			req.session.destroy();
			return res.redirect('/');
		}).catch(_ => res.redirect('/'));
});

module.exports = router;
