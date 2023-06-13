const express = require('express');

const router = express.Router();
const csrf = require('csurf');
const { Configuration } = require('@hpi-schul-cloud/commons');
const auth = require('../helpers/authentication');
const api = require('../api');

const csrfProtection = csrf({ cookie: true });

const getVersion = () => {
	if (Configuration.has('FEATURE_LEGACY_HYDRA_ENABLED')) {
		return Configuration.get('FEATURE_LEGACY_HYDRA_ENABLED') ? 'v1' : 'v3';
	}
	return 'v3';
};

const VERSION = getVersion();

router.get('/login', csrfProtection, (req, res, next) => api(req, { version: VERSION })
	.get(`/oauth2/loginRequest/${req.query.login_challenge}`).then((loginRequest) => {
		req.session.login_challenge = req.query.login_challenge;
		if (loginRequest.skip) {
			return res.redirect('/oauth2/login/success');
		}
		return res.redirect(Configuration.get('NOT_AUTHENTICATED_REDIRECT_URL'));
	}).catch(next));

router.get('/login/success', csrfProtection, auth.authChecker, (req, res, next) => {
	if (!req.session.login_challenge) res.redirect('/dashboard/');

	const body = {
		remember: true,
		remember_for: 0,
	};

	return api(req, { version: VERSION })
		.patch(
			`/oauth2/loginRequest/${req.session.login_challenge}/?accept=1`,
			{ body },
		).then((loginRequest) => {
			delete (req.session.login_challenge);
			return res.redirect(loginRequest.redirect_to);
		}).catch(next);
});

router.all('/logout', csrfProtection, auth.authChecker, (req) => {
	api(req, { version: VERSION }).get('/oauth2/logoutRequest');
});

router.all('/logout/redirect', csrfProtection, auth.authChecker, (req, res, next) => {
	const body = {
		redirect_to: '',
	};

	return api(req, { version: VERSION }).patch(`/oauth2/logoutRequest/${req.query.logout_challenge}`, { body })
		.then((logoutRequest) => res.redirect(logoutRequest.redirect_to)).catch(next);
});

const acceptConsent = (r, w, challenge, grantScopes, remember = false) => {
	const body = {
		grant_scope: (Array.isArray(grantScopes) ? grantScopes : [grantScopes]),
		remember,
		remember_for: 60 * 60 * 24 * 30,
	};

	return api(r, { version: VERSION }).patch(`/oauth2/consentRequest/${challenge}/?accept=1`, { body })
		.then((consentRequest) => w.redirect(consentRequest.redirect_to));
};

const displayScope = (scope, w) => {
	switch (scope) {
		case 'openid':
			return w.$t('login.oauth2.label.openId');
		case 'profile':
			return w.$t('login.oauth2.label.yourName');
		case 'email':
			return w.$t('login.oauth2.label.email');
		default:
			return scope;
	}
};

router.get('/consent', csrfProtection, auth.authChecker, (req, res, next) => {
	// This endpoint is hit when hydra initiates the consent flow
	if (req.query.error) {
		// An error occurred (at hydra)
		return res.send(`${req.query.error}<br />${req.query.error_description}`);
	}
	return api(req, { version: VERSION }).get(`/oauth2/consentRequest/${req.query.consent_challenge}`)
		.then(async (consentRequest) => {
			let skipConsent = consentRequest.context && consentRequest.context.skipConsent;

			// Cannot skip consent for CTL-Tools with legacy hydra endpoints.
			// Legacy endpoints are not supported by CTL-Tools.
			if (VERSION === 'v1') {
				const tools = await api(req)
					.get(`/ltiTools/?oAuthClientId=${consentRequest.client.client_id}&isLocal=true`);

				if (tools.data && Array.isArray(tools.data) && tools.data.length === 1) {
					({ skipConsent } = tools.data[0]);
				} else {
					throw new Error(
						`Cannot find a LtiTool with client_id ${consentRequest.client.client_id} for consent request`,
					);
				}
			}

			if (consentRequest.skip || skipConsent) {
				return acceptConsent(req, res, req.query.consent_challenge, consentRequest.requested_scope);
			}

			return res.render('oauth2/consent', {
				inline: true,
				title: res.$t('login.oauth2.headline.loginWithSchoolCloud', {
					title: res.locals.theme.title,
				}),
				subtitle: '',
				client: consentRequest.client.client_name,
				action: `/oauth2/consent?challenge=${req.query.consent_challenge}`,
				buttonLabel: res.$t('global.button.accept'),
				scopes: consentRequest.requested_scope.map((scope) => ({
					display: displayScope(scope, res),
					value: scope,
				})),
			});
		}).catch(next);
});

router.post('/consent', auth.authChecker, (r, w) => acceptConsent(r, w, r.query.challenge, r.body.grantScopes, true));

router.get('/username/:pseudonym', (req, res, next) => {
	if (req.cookies.jwt) {
		return api(req).get('/pseudonym', {
			qs: {
				pseudonym: req.params.pseudonym,
			},
		}).then((pseudonym) => {
			let shortName;
			let completeName;
			const anonymousName = '???';
			completeName = anonymousName;
			shortName = completeName;
			if (pseudonym.data.length) {
				completeName = `${pseudonym.data[0].user.firstName} ${pseudonym.data[0].user.lastName}`;
				shortName = `${pseudonym.data[0].user.firstName} ${pseudonym.data[0].user.lastName.charAt(0)}.`;
			}
			return res.render('oauth2/username', {
				depseudonymized: true,
				completeName,
				shortName,
				infoText: res.$t('login.oauth2.text.yourNameIsProtected', {
					shortTitle: res.locals.theme.short_title,
				}),
			});
		}).catch(next);
	}
	return res.render('oauth2/username', {
		depseudonymized: false,
		completeName: res.$t('login.oauth2.label.showName'),
		shortName: res.$t('login.oauth2.label.showName'),
		infoText: '',
	});
});

module.exports = router;
