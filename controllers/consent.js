const express = require('express')
const Hydra = require('ory-hydra-sdk')
const router = express.Router()
const OAuth2 = require('simple-oauth2')
const qs = require('querystring')
const api = require('../api')
const auth = require('../helpers/authentication')

const scope = 'hydra.consent'
const oauth2 = OAuth2.create({
  client: {
    id: qs.escape('consent-app'),
    secret: qs.escape('consent-secret')
  },
  auth: {
    tokenHost: endpoint = 'http://ory-hydra-example--hydra:4444',
    authorizePath: authorizePath = '/oauth2/auth',
    tokenPath: tokenPath = '/oauth2/token'
  },
  options: {
    useBodyAuth: false,
    useBasicAuthorizationHeader: true
  }
})


Hydra.ApiClient.instance.basePath = 'http://ory-hydra-example--hydra:4444'

const hydra = new Hydra.OAuth2Api()

const refreshToken = () => oauth2.clientCredentials
  .getToken({ scope })
  .then((result) => {
    const token = oauth2.accessToken.create(result);
    const hydraClient = Hydra.ApiClient.instance
    hydraClient.authentications.oauth2.accessToken = token.token.access_token
    return Promise.resolve(token)
  })
  .catch((error) => {
    console.error('Could not refresh access token', error.message);
  });

refreshToken().then()

// A simple error helper
const catcher = (w) => (error) => {
  console.error(error)
  w.render('error', { error })
  w.status(500)
  return Promise.reject(error)
}

// This is a mock object for the user. Usually, you would fetch this from, for example, mysql, or mongodb, or somewhere else.
// The data is arbitrary, but will require a unique user id.
const user = {
  email: 'dan@acme.com',
  password: 'secret',

  email_verified: true,
  user_id: 'user:12345:dandean',
  name: 'Dan Dean',
  nickname: 'Danny',
}

const resolver = (resolve, reject) => (error, data, response) => {
  if (error) {
    return reject(error)
  } else if (response.statusCode < 200 || response.statusCode >= 400) {
    return reject(new Error('Consent endpoint gave status code ' + response.statusCode + ', but status code 200 was expected.'))
  }

  resolve(data)
}

// This get's executed when we want to tell hydra that the user is authenticated and that he authorized the application
const resolveConsent = (r, w, consent, grantScopes = []) => {
  const subject = w.locals.currentUser._id
  const idTokenExtra = {}

  // Sometimes the body parser doesn't return an array, so let's fix that.
  if (!Array.isArray(grantScopes)) {
    grantScopes = [grantScopes]
  }

  // TODO: include users pseudonym specific for consumer
  // This is the openid 'profile' scope which should include some user profile data. (optional)
  if (grantScopes.indexOf('pseudonym') >= 0) {
    idTokenExtra.pseudonym = 'achdbsd'
  }

  refreshToken().then(() => {
    // Do not return this directly, otherwise `then()` will be called, causing superagent to fail with the double
    // callback bug.
    hydra.getOAuth2ConsentRequest(r.query.consent,
      resolver(
        (consentRequest) => hydra.acceptOAuth2ConsentRequest(r.query.consent, {
            subject,
            grantScopes,
            idTokenExtra,
            accessTokenExtra: {}
          },
          resolver(() => w.redirect(consentRequest.redirectUrl), catcher(w))
        ),
        catcher(w)
      )
    )
  })
}

router.get('/consent', (r, w) => {
  // This endpoint is hit when hydra initiates the consent flow
  if (r.query.error) {
    // An error occurred (at hydra)
    return w.render('error', { error: { name: r.query.error, message: r.query.error_description } })
  }

  refreshToken().then(() => {
    // Do not return this directly, otherwise `then()` will be called, causing superagent to fail with the double
    // callback bug.
    hydra.getOAuth2ConsentRequest(r.query.consent, resolver((consentRequest) => {
      // consentRequest contains informations such as requested scopes, client id, ...
      console.log(consentRequest);
      // Here you could, for example, allow clients to force a user's consent. Since you're able to
      // say which scopes a client can request in hydra, you could allow this for a few highly priviledged clients!
      //
      // if (consentRequest.scp.find((s) => s === 'force-consent')) {
      //   resolveConsent(r, w, r.query.consent, consentRequest.requestedScopes)
      //   return Promise.resolve()
      // }

      // render the consent screen
      return w.render('consent/consent', {
        inline: true,
        title: 'Login mit Schul-Cloud',
        subtitle: '',
        client: consentRequest.clientId,
        action: `/consent/consent?consent=${r.query.consent}`,
        buttonLabel: 'Akzeptieren',
        scopes: consentRequest.requestedScopes
      });

    }, catcher(w)))
  })
})

router.post('/consent', auth.authChecker, (r, w) => {
  resolveConsent(r, w, r.query.consent, r.body.allowed_scopes)
})

router.get('/login', (r, w) => {
  w.render('login', { error: r.query.error, user, consent: r.query.consent })
})

router.post('/login', (r, w) => {
  const form = r.body
  // TODO: request login
  if (form.email !== user.email || form.password !== user.password) {
    w.redirect('/login?error=Wrong+credentials+provided&consent=' + form.consent)
  }

  r.session.isAuthenticated = true
  w.redirect('/consent?consent=' + r.body.consent)
})

router.get('/', (r, w) => w.send('This is an exemplary consent app for Hydra. Please read the hydra docs on how to use this router.'))

module.exports = router
