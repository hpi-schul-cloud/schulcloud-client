/*
 * One Controller per layout view
 */

const express = require('express');

const router = express.Router();
const { Configuration } = require('@hpi-schul-cloud/commons');
const Handlebars = require('handlebars');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const redirectHelper = require('../helpers/redirect');

const {
	logger,
	formatError,
} = require('../helpers');
const { LoginSchoolsCache } = require('../helpers/cache');

Handlebars.registerHelper('oauthLink', (oauthConfig, alias) => {
	const encodedURI = [
		oauthConfig.authEndpoint,
		'?client_id=',
		oauthConfig.clientId,
		'&redirect_uri=',
		oauthConfig.redirectUri,
		'&response_type=',
		oauthConfig.responseType,
		'&scope=',
		oauthConfig.scope,
	].join('');
	// provider works for now, but maybe not the best differentiating feature in the future
	if (oauthConfig.provider === 'oauth') {
		return encodeURI([
			encodedURI,
			'&kc_idp_hint=',
			alias,
		].join(''));
	}
	return encodeURI([encodedURI]);
});

// SSO Login
router.get('/tsp-login/', (req, res, next) => {
	const {
		ticket,
		redirect: redirectParam,
	} = req.query;
	let redirect = '/dashboard';
	if (redirectParam) {
		if (Array.isArray(redirectParam)) {
			const redirects = redirectParam.filter((v) => v !== 'true');
			if (redirects.length > 0) {
				redirect = redirects[0];
			}
		} else if (String(redirectParam) !== 'true') {
			redirect = redirectParam;
		}
	}
	redirect = redirectHelper.getValidRedirect(redirect);
	return authHelper.login({
		strategy: 'tsp',
		ticket,
		redirect,
	}, req, res, next);
});

// Login
router.post('/login/', (req, res, next) => {
	const {
		username,
		password,
		system,
		schoolId,
		redirect,
	} = req.body;
	const validRedirect = redirectHelper.getValidRedirect(redirect);
	const privateDevice = req.body.privateDevice === 'true';
	const errorSink = () => next();

	if (system) {
		const [systemId, strategy] = system.split('//');
		return authHelper.login({
			strategy,
			username,
			password,
			systemId,
			schoolId,
			redirect: validRedirect,
			privateDevice,
		}, req, res, errorSink);
	}
	return authHelper.login({
		strategy: 'local',
		username,
		password,
		redirect: validRedirect,
		privateDevice,
	}, req, res, errorSink);
});

const redirectAuthenticated = (req, res) => {
	let redirectUrl = '/login/success';
	if (req.query && req.query.redirect) {
		redirectUrl = `${redirectUrl}?redirect=${req.query.redirect}`;
	}
	return res.redirect(redirectHelper.getValidRedirect(redirectUrl));
};

const determineRedirectUrl = (req) => {
	if (req.query && req.query.redirect) {
		return redirectHelper.getValidRedirect(req.query.redirect);
	}
	if (req.session.login_challenge) {
		return '/oauth2/login/success';
	}
	return '/dashboard';
};

const getNonOauthSchools = (schools) => [...schools]
	.filter((school) => school.systems.filter((system) => system.oauthConfig || system.type === 'oidc').length === 0);

async function getOauthSystems(req) {
	return api(req, { version: 'v3' })
		.get('/systems/public?onlyOauth=true')
		.catch((err) => logger.error('error loading oauth system list', formatError(err)));
}

router.all('/', async (req, res, next) => {
	const isAuthenticated = await authHelper.isAuthenticated(req);
	if (isAuthenticated) {
		redirectAuthenticated(req, res);
	} else {
		const schools = await LoginSchoolsCache.get(req);

		const oauthSystems = await getOauthSystems(req);

		res.render('authentication/home', {
			schools: getNonOauthSchools(schools),
			systems: [],
			oauthSystems: oauthSystems.data || [],
			inline: true,
		});
	}
});

const mapErrorCodeToTranslation = (errorCode) => {
	switch (errorCode) {
		case 'sso_user_notfound':
			return 'login.text.userNotFound';
		case 'sso_oauth_access_denied':
			return 'login.text.accessDenied';
		case 'sso_jwt_problem':
		case 'sso_oauth_invalid_request':
		case 'sso_oauth_unsupported_response_type':
		case 'sso_auth_code_step':
			return 'login.text.oauthCodeStep';
		case 'sso_internal_error':
			return 'login.text.internalError';
		default:
			return 'login.text.oauthLoginFailed';
	}
};

const renderLogin = async (req, res) => {
	await authHelper.clearCookie(req, res);

	const schools = await LoginSchoolsCache.get(req);
	const redirect = redirectHelper.getValidRedirect(req.query && req.query.redirect ? req.query.redirect : '');

	let oauthErrorLogout = false;
	if (req.query.error) {
		res.locals.notification = {
			type: 'danger',
			message: res.$t(mapErrorCodeToTranslation(req.query.error)),
		};
		if (req.query.provider === 'iserv' && req.query.error !== 'sso_oauth_access_denied') {
			oauthErrorLogout = true;
		}
	}

	const strategyOfSchool = req.query.strategy;
	const idOfSchool = req.query.schoolId;

	const oauthSystems = await getOauthSystems(req);

	res.render('authentication/login', {
		schools: getNonOauthSchools(schools),
		systems: [],
		oauthSystems: oauthSystems.data || [],
		oauthErrorLogout,
		hideMenu: true,
		redirect,
		idOfSchool,
		strategyOfSchool,
	});
};

router.get('/loginRedirect', (req, res, next) => {
	authHelper.isAuthenticated(req)
		.then((isAuthenticated) => {
			if (isAuthenticated) {
				redirectAuthenticated(req, res);
			} else if (Configuration.get('FEATURE_MULTI_LOGIN_INSTANCES')) {
				res.redirect('/login-instances');
			} else {
				res.redirect('/login');
			}
		})
		.catch(next);
});

router.all('/login/', async (req, res, next) => {
	authHelper.isAuthenticated(req)
		.then((isAuthenticated) => {
			if (isAuthenticated) {
				redirectAuthenticated(req, res);
			} else {
				renderLogin(req, res);
			}
		})
		.catch(next);
});

router.all('/login/superhero/', (req, res, next) => {
	res.locals.notification = {
		type: 'danger',
		message: res.$t('login.text.superheroForbidden'),
		statusCode: 401,
		timeToWait: Configuration.get('LOGIN_BLOCK_TIME'),
	};
	renderLogin(req, res)
		.catch(next);
});

router.get('/login/success', authHelper.authChecker, async (req, res, next) => {
	if (res.locals.currentUser) {
		if (res.locals.currentPayload.forcePasswordChange) {
			return res.redirect('/forcePasswordChange');
		}

		const user = res.locals.currentUser;
		const redirectUrl = determineRedirectUrl(req);
		// check consent versions
		const {
			haveBeenUpdated,
			consentStatus,
		} = await api(req)
			.get(`/consents/${user._id}/check/`, {
				qs: {
					simple: true,
				},
			});

		if (consentStatus === 'ok' && haveBeenUpdated === false) {
			return res.redirect(redirectUrl);
		}
		// make sure fistLogin flag is not set
		return res.redirect('/firstLogin');
	}

	// if this happens: SSO
	const {
		accountId,
		systemId,
		schoolId,
	} = res.locals.currentPayload || {};
	if (accountId && systemId && schoolId) {
		const schools = await LoginSchoolsCache.get(req);
		if (schools.length > 0) {
			const checkSchool = schools.find((school) => school._id === schoolId);
			if (checkSchool && checkSchool.systems) {
				const schoolWithSystem = checkSchool.systems.find(
					(system) => system._id === systemId,
				);
				if (schoolWithSystem) {
					res.redirect(`/registration/${schoolId}/sso/${accountId}`);
				}
			}
		}
	}

	const redirectUrl = determineRedirectUrl(req);
	res.redirect(redirectUrl);

	return null;
});

const sessionDestroyer = (req, res, rej, next) => {
	if (req.url === '/logout') {
		req.session.destroy((err) => {
			if (err) {
				rej(`Error destroying session: ${err}`);
			} else {
				// clear the CSRF token to prevent re-use after logout
				res.locals.csrfToken = null;
			}
		});
	}
	return next();
};

router.get('/logout/', (req, res, next) => {
	api(req)
		.del('/authentication') // async, ignore result
		.catch((err) => {
			logger.error('error during logout.', formatError(err));
		});
	return authHelper.clearCookie(req, res, sessionDestroyer)
		// eslint-disable-next-line prefer-template, no-return-assign
		.then(() => { 
		res.statusCode = 307;
		res.redirect('/');
		})
		.catch(next);
});

module.exports = router;
