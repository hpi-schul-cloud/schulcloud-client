const express = require('express');

const router = express.Router();
const csrf = require('csurf');
const auth = require('../helpers/authentication');
const api = require('../api');

const csrfProtection = csrf({ cookie: true });

router.get('/login', csrfProtection, (req, res, next) => api(req)
	.get(`/oauth2/loginRequest/${req.query.login_challenge}`).then((loginRequest) => {
		req.session.login_challenge = req.query.login_challenge;
		if (loginRequest.skip) {
			res.redirect('/oauth2/login/success');
		} else {
			res.redirect(req.app.Config.get('NOT_AUTHENTICATED_REDIRECT_URL'));
		}
	}));

router.get('/login/success', csrfProtection, auth.authChecker, (req, res, next) => {
	if (!req.session.login_challenge) res.redirect('/dashboard/');

	const body = {
		remember: false,
		remember_for: 0,
	};

	api(req).patch(`/oauth2/loginRequest/${req.session.login_challenge}/?accept=1`,
		{ body }).then((loginRequest) => {
		delete (req.session.login_challenge);
		res.redirect(loginRequest.redirect_to);
	});
});

const acceptConsent = (r, w, challenge, grantScopes, remember = false) => {
	const body = {
		grant_scope: (Array.isArray(grantScopes) ? grantScopes : [grantScopes]),
		remember,
		remember_for: 60 * 60 * 24 * 30,
	};

	return api(r).patch(`/oauth2/consentRequest/${challenge}/?accept=1`, { body })
		.then(consentRequest => w.redirect(consentRequest.redirect_to));
};

router.get('/consent', csrfProtection, auth.authChecker, (r, w) => {
	// This endpoint is hit when hydra initiates the consent flow
	if (r.query.error) {
		// An error occurred (at hydra)
		return w.send(`${r.query.error}<br />${r.query.error_description}`);
	}
	return api(r).get(`/oauth2/consentRequest/${r.query.consent_challenge}`).then((consentRequest) => {
		if (consentRequest.skip) {
			return acceptConsent(r, w, r.query.consent_challenge, consentRequest.requested_scope);
		}
		return w.render('oauth2/consent', {
			inline: true,
			title: 'Login mit Schul-Cloud',
			subtitle: '',
			client: consentRequest.client.client_name,
			action: `/oauth2/consent?challenge=${r.query.consent_challenge}`,
			buttonLabel: 'Akzeptieren',
			scopes: consentRequest.requested_scope.map(scope => ({
				display: (scope === 'openid'
					? 'eine eindeutige Zeichenfolge, die keinen Rückschluss auf deine wahre Identität zulässt'
					: scope),
				value: scope,
			})),
		});
	});
});

router.post('/consent', auth.authChecker, (r, w) => acceptConsent(r, w, r.query.challenge, r.body.grantScopes, true));

router.get('/username/:pseudonym', (req, res, next) => {
	api(req).get('/pseudonym', {
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
		res.render('oauth2/username', {
			completeName,
			shortName,
			infoText: 'Der Anbieter dieses Bildungsinhaltes ist nicht im Wissen des echten Namens, da dieser direkt aus'
      + ' der Schul-Cloud abgerufen wird. Es handelt sich um ein sogenanntes Iframe, das Seiten anderer Webserver'
      + ' anzeigen kann.',
		});
	});
});

module.exports = router;
