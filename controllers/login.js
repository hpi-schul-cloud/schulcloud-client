/*
 * One Controller per layout view
 */

const express = require('express');
const feedr = require('feedr').create();

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const userConsentVersions = require('../helpers/consentVersions');

const logger = require('../helpers/logger');

const getSelectOptions = (req, service, query) => api(req).get(`/${service}`, {
	qs: query,
}).then(data => data.data);

const clearCookie = (req, res, options = { destroySession: false }) => {
	if (options.destroySession && req.session && req.session.destroy) {
		req.session.destroy();
	}
	res.clearCookie('jwt');
	if (res.locals && res.locals.domain) {
		res.clearCookie('jwt', { domain: res.locals.domain });
	}
};

// SSO Login

router.get('/tsp-login/', (req, res, next) => {
	const ticket = req.query.ticket;
	return authHelper.login({ strategy: 'tsp', ticket }, req, res, next);
});

// Login

router.post('/login/', (req, res, next) => {
	const {
		username,
		password,
		systemId,
		schoolId,
	} = req.body;

	if (systemId) {
		return api(req).get(`/systems/${req.body.systemId}`).then(system => login({
			strategy: system.type, username, password, systemId, schoolId,
		}));
	}
	return authHelper.login({ strategy: 'local', username, password }, req, res, next);
});


router.all('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return res.redirect('/login/success/');
		}
		return new Promise((resolve) => {
			feedr.readFeed('https://blog.schul-cloud.org/rss', {
				requestOptions: { timeout: 2000 },
			}, (err, data /* , headers */) => {
				let blogFeed;
				try {
					blogFeed = data.rss.channel[0].item
						.filter(item => (item['media:content'] || []).length && (item.link || []).length)
						.slice(0, 3)
						.map((e) => {
							const date = new Date(e.pubDate);
							const locale = 'en-us';
							const month = date.toLocaleString(locale, { month: 'long' });
							e.pubDate = `${date.getDate()}. ${month}`;
							e.description = e.description.join(' ');
							e.url = e.link[0];
							e.img = {
								src: e['media:content'][0].$.url,
								alt: e.title,
							};
							return e;
						});
				} catch (e) {
					// just catching the blog-error
					blogFeed = [];
				}
				const schoolsPromise = getSelectOptions(
					req, 'schools',
					{
						purpose: { $ne: 'expert' },
						$limit: false,
						$sort: 'name',
					},
				);
				resolve(schoolsPromise.then(schools => res.render('authentication/home', {
					schools,
					blogFeed,
					inline: true,
					systems: [],
				})));
			});
		});
	});
});

router.all('/login/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return res.redirect('/login/success/');
		}
		return getSelectOptions(req,
			'schools', {
				purpose: { $ne: 'expert' },
				$limit: false,
				$sort: 'name',
			})
			.then((schools) => {
				clearCookie(req, res);
				res.render('authentication/login', {
					schools,
					systems: [],
				});
			});
	}).catch((error) => {
		logger.error(error);
		clearCookie(req, res, { destroySession: true });
		return res.redirect('/');
	});
});

const ssoSchoolData = (req, systemId) => api(req).get('/schools/', {
	qs: {
		systems: systemId,
	},
}).then((schools) => {
	if (schools.data.length > 0) {
		return schools.data[0];
	}
	return undefined;
}).catch(() => undefined); // fixme this is a very bad error catch
// so we can do proper redirecting and stuff :)

router.get('/login/success', authHelper.authChecker, (req, res, next) => {
	if (res.locals.currentUser) {
		const user = res.locals.currentUser;
		api(req).get('/consents/', { qs: { userId: user._id } })
			.then((consents) => {
				if (consents.data.length === 0) {
					// user has no consent; create one and try again to get the proper redirect.
					return api(req).post('/consents/', { json: { userId: user._id } })
						.then(() => {
							res.redirect('/login/success');
						});
				}
				const consent = consents.data[0];
				const redirectUrl = (req.session.login_challenge
					? '/oauth2/login/success'
					: '/dashboard');
				// check consent versions
				return userConsentVersions(res.locals.currentUser, consent, req).then((consentUpdates) => {
					if (consent.access && !consentUpdates.haveBeenUpdated) {
						return res.redirect(redirectUrl);
					}
					// make sure fistLogin flag is not set
					return res.redirect('/firstLogin');
				});
			});
	} else {
		// if this happens: SSO
		const { accountId, systemId } = (res.locals.currentPayload || {});

		ssoSchoolData(req, systemId).then((school) => {
			if (school === undefined) {
				const redirectUrl = (req.session.login_challenge
					? '/oauth2/login/success'
					: '/dashboard/');
				res.redirect(redirectUrl);
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
		.then(() => {
			clearCookie(req, res, { destroySession: true });
			return res.redirect('/');
		}).catch(() => res.redirect('/'));
});

module.exports = router;
