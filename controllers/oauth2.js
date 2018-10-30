const express = require('express')
const router = express.Router();
const auth = require('../helpers/authentication');
const api = require('../api');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

router.get('/login', csrfProtection, (req, res, next) => {
  return api(req).get('/oauth2/loginRequest/' + req.query.login_challenge).then(loginRequest => {
    req.session.login_challenge = req.query.login_challenge;
    if (loginRequest.skip) {
      res.redirect('/oauth2/login/success');
    } else {
      res.redirect('/login');
    }
  })
})

router.get('/login/success', csrfProtection, auth.authChecker, (req, res, next) => {
  if(!req.session.login_challenge) res.redirect('/dashboard/');

  const body = {
    remember: false,
    remember_for: 3600,
    subject: res.locals.currentUser._id
  }

  return auth.populateCurrentUser(req, res)
    .then(_ => api(req).patch('/oauth2/loginRequest/' + req.session.login_challenge + '/?accept=1', {body}))
    .then(loginRequest => {
        res.redirect(loginRequest.redirect_to);
    });
});

router.get('/consent', csrfProtection, auth.authChecker, (r, w) => {
  // This endpoint is hit when hydra initiates the consent flow
  if (r.query.error) {
    // An error occurred (at hydra)
    return w.send(`${r.query.error}<br />${r.query.error_description}`);
  }
  return api(r).get('/oauth2/consentRequest/' + r.query.consent_challenge).then(consentRequest => {
    return w.render('oauth2/consent', {
      inline: true,
      title: 'Login mit Schul-Cloud',
      subtitle: '',
      client: consentRequest.client.client_id,
      action: `/oauth2/consent?challenge=${r.query.consent_challenge}`,
      buttonLabel: 'Akzeptieren',
      scopes: consentRequest.requested_scope
    })
  })
})

router.post('/consent', auth.authChecker, (r, w) => {
  const grantScopes = r.body.allowed_scopes;
  const body = {
    grant_scope: (Array.isArray(grantScopes) ? grantScopes : [grantScopes]),
    session: {
      id_token: { sub: 'test' },
    }
  }

  return api(r).patch('/oauth2/consentRequest/' +  r.query.challenge + '/?accept=1', {body}
  ).then(consentRequest => w.redirect(consentRequest.redirect_to));
})

module.exports = router
