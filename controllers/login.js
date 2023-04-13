/*
 * One Controller per layout view
 */

const express = require('express');

const router = express.Router();
const { Configuration } = require('@hpi-schul-cloud/commons');
const shortid = require('shortid');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const redirectHelper = require('../helpers/redirect');

const {
	logger,
	formatError,
} = require('../helpers');
const { LoginSchoolsCache } = require('../helpers/cache');

// SSO Login
router.get('/tsp-login/', (req, res, next) => {
	const {
		ticket,
		redirect: redirectParam,
	} = req.query;
	let redirect = '/';
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

router.post('/login/local', async (req, res) => {
	const { redirect } = req.query;
	const {
		username,
		password,
	} = req.body;

	const payload = {
		username,
		password,
	};

	await authHelper.loginUser(req, res, 'local', payload, redirect);
});

router.post('/login/ldap', async (req, res) => {
	const { redirect } = req.query;
	const {
		username,
		password,
		schoolId,
		systemId,
	} = req.body;

	const payload = {
		username,
		password,
		systemId,
		schoolId,
	};

	await authHelper.loginUser(req, res, 'ldap', payload, redirect);
});

const redirectLoginError = (res, error) => {
	authHelper.setErrorNotification(res, error);
	res.redirect('/login');
};

router.get('/login/oauth2/:systemId', async (req, res) => {
	const { redirect, migration } = req.query;
	const { systemId } = req.params;

	try {
		const response = await api(req, { version: 'v3' }).get(`/systems/public/${systemId}`);

		const { oauthConfig } = response.data;

		if (!oauthConfig) {
			return redirectLoginError(res, {
				type: 'UNPROCESSABLE_ENTITY',
				code: 422,
			});
		}

		const state = shortid.generate();

		const authenticationUrl = authHelper.getAuthenticationUrl(oauthConfig, state);

		req.session.oauth2State = {
			state,
			systemId,
			postLoginRedirect: redirect,
			migration,
		};

		return res.redirect(authenticationUrl.toString());
	} catch (error) {
		return redirectLoginError(res, error);
	}
});

router.get('/login/oauth2-redirect', async (req, res) => {
	const { code, error } = req.query;
	const { oauth2State } = req.session;

	if (error) {
		return redirectLoginError(res, {
			type: error.toUpperCase(),
			code: 401,
		});
	}

	if (!oauth2State || !oauth2State.systemId) {
		return redirectLoginError(res, {
			type: 'UNAUTHORIZED',
			code: 401,
		});
	}

	const payload = {
		code,
		systemId: oauth2State.systemId,
		redirectUri: authHelper.oauth2RedirectUri,
	};

	if (oauth2State.migration && await authHelper.isAuthenticated(req)) {
		await authHelper.migrateUser(req, res, payload);
	} else {
		const redirect = oauth2State.postLoginRedirect;

		await authHelper.loginUser(req, res, 'oauth2', payload, redirect);
	}

	return delete req.session.oauth2State;
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
			return 'login.text.loginFailed';
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

	const oauthSystemsResponse = await getOauthSystems(req);
	const oauthSystems = oauthSystemsResponse.data || [];

	oauthSystems.forEach((system) => {
		const serverLoginUrl = `${Configuration.get('PUBLIC_BACKEND_URL')}/v3/sso/login/${system.id}`;
		const clientLoginUrl = `/login/oauth2/${system.id}`;

		system.loginLink = Configuration.get('FEATURE_CLIENT_USER_LOGIN_MIGRATION_ENABLED')
			? clientLoginUrl
			: serverLoginUrl;
	});

	res.render('authentication/login', {
		schools: getNonOauthSchools(schools),
		systems: [],
		oauthSystems,
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
	console.log(res.locals);

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

router.get('/login/success', authHelper.authChecker, async (req, res) => {
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

		if (consentStatus === 'ok' && haveBeenUpdated === false && (res.locals.currentUser.preferences || {}).firstLogin) {
			return res.redirect(redirectUrl);
		}

		// make sure fistLogin flag is not set
		return res.redirect(`/firstLogin?redirect=${redirectUrl}`);
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
