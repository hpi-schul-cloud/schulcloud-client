/*
 * One Controller per layout view
 */

const express = require('express');

const router = express.Router();
const { Configuration } = require('@hpi-schul-cloud/commons');
const Handlebars = require('handlebars');
const shortid = require('shortid');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const redirectHelper = require('../helpers/redirect');

const {
	logger,
	formatError,
} = require('../helpers');
const { LoginSchoolsCache } = require('../helpers/cache');

Handlebars.registerHelper('oauthLink', (id) => {
	const apiUrl = `${Configuration.get('PUBLIC_BACKEND_URL')}/v3/sso/login/${id}`;
	return apiUrl;
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

router.post('/login/email', async (req, res) => {
	const {
		username,
		password,
		redirect,
	} = req.body;

	const payload = {
		username,
		password,
	};

	await authHelper.loginUser(req, res, 'local', payload, redirect, 'Email');
});

router.get('/login/email', (req, res) => {
	const queryString = new URLSearchParams({
		strategy: 'email',
	});

	if (req.query.redirect) {
		queryString.append('redirect', redirectHelper.getValidRedirect(req.query.redirect));
	}

	const redirect = redirectHelper.joinPathWithQuery('/login', queryString.toString());

	res.redirect(redirect);
});

// eslint-disable-next-line consistent-return
router.post('/login/ldap', async (req, res) => {
	const {
		username,
		password,
		schoolId,
		system,
		redirect,
	} = req.body;

	if (!system) {
		return authHelper.handleLoginError(req, res, {
			type: 'BAD_REQUEST',
			code: 400,
		}, redirect);
	}

	const systemIdAndAliasCombination = system.split('//');

	if (systemIdAndAliasCombination.length < 2) {
		return authHelper.handleLoginError(req, res, {
			type: 'BAD_REQUEST',
			code: 400,
		}, redirect);
	}

	const systemId = systemIdAndAliasCombination[0];

	const payload = {
		username,
		password,
		systemId,
		schoolId,
	};

	await authHelper.loginUser(req, res, 'ldap', payload, redirect, 'LDAP');
});

router.get('/login/ldap', (req, res) => {
	const queryString = new URLSearchParams({
		strategy: 'ldap',
	});

	if (req.query.redirect) {
		queryString.append('redirect', redirectHelper.getValidRedirect(req.query.redirect));
	}

	const redirect = redirectHelper.joinPathWithQuery('/login', queryString.toString());

	res.redirect(redirect);
});

// eslint-disable-next-line consistent-return
const redirectOAuth2Authentication = async (req, res, systemId, migration, redirect) => {
	let system;
	try {
		system = await api(req, { version: 'v3' }).get(`/systems/public/${systemId}`);
	} catch (error) {
		return authHelper.handleLoginError(req, res, error.error, redirect);
	}

	const { oauthConfig } = system;

	if (!oauthConfig) {
		return authHelper.handleLoginError(req, res, {
			type: 'UNPROCESSABLE_ENTITY',
			code: 422,
		}, redirect);
	}

	const state = shortid.generate();

	const authenticationUrl = authHelper.getAuthenticationUrl(oauthConfig, state, migration);

	req.session.oauth2State = {
		state,
		systemId,
		systemName: system.displayName,
		postLoginRedirect: redirect,
		migration,
	};

	res.redirect(authenticationUrl.toString());
};

router.post('/login/oauth2', async (req, res) => {
	const {
		systemId,
		migration,
		redirect,
	} = req.body;

	await redirectOAuth2Authentication(req, res, systemId, migration, redirect);
});

router.get('/login/oauth2/:systemId', async (req, res) => {
	const { systemId } = req.params;
	const {
		migration,
		redirect,
	} = req.query;

	await redirectOAuth2Authentication(req, res, systemId, migration, redirect);
});

// eslint-disable-next-line consistent-return
router.get('/login/oauth2-callback', async (req, res) => {
	const { code, error } = req.query;
	const { oauth2State } = req.session;

	if (!oauth2State || !oauth2State.systemId) {
		return authHelper.handleLoginError(req, res, {
			type: 'UNAUTHORIZED',
			code: 401,
		});
	}

	const redirect = oauth2State.postLoginRedirect;

	if (error) {
		return authHelper.handleLoginError(req, res, {
			type: error.toUpperCase(),
			code: 401,
		}, redirect);
	}

	const payload = {
		code,
		systemId: oauth2State.systemId,
		redirectUri: authHelper.oauth2RedirectUri,
	};

	if (oauth2State.migration && await authHelper.isAuthenticated(req)) {
		await authHelper.migrateUser(req, res, payload);
	} else {
		await authHelper.loginUser(req, res, 'oauth2', payload, redirect, oauth2State.systemName);
	}

	delete req.session.oauth2State;
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

const filterSchoolsWithLdapLogin = (schools) => schools
	// eslint-disable-next-line max-len
	.filter((school) => school.systems.some((system) => system.type === 'ldap' && !system.oauthConfig));

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
			schools: filterSchoolsWithLdapLogin(schools),
			systems: [],
			oauthSystems: oauthSystems.data || [],
			inline: true,
			showAlerts: (Configuration.get('FEATURE_ALERTS_ON_HOMEPAGE_ENABLED')),
			showLoginAndRegisterButtons: (Configuration.get('FEATURE_BUTTONS_ON_LOGINPAGE_ENABLED')),
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
		case 'sso_user_not_found_after_provisioning':
			return 'login.text.userNotFoundInUnprovisionedSchool';
		case 'SCHOOL_IN_MIGRATION':
			return 'login.text.schoolInMigration';
		default:
			return 'login.text.loginFailed';
	}
};

const renderLogin = async (req, res) => {
	await authHelper.clearCookie(req, res);

	const schools = await LoginSchoolsCache.get(req);
	const redirect = req.query && req.query.redirect ? redirectHelper.getValidRedirect(req.query.redirect) : undefined;

	let oauthErrorLogout = false;

	if (req.query.error) {
		res.locals.notification = {
			type: 'danger',
			message: res.$t(mapErrorCodeToTranslation(req.query.error), {
				systemName: 'moin.schule',
				shortTitle: res.locals.theme.short_title,
			}),
		};
		if (req.query.provider === 'iserv' && req.query.error !== 'sso_oauth_access_denied') {
			oauthErrorLogout = true;
		}
	}

	const strategyOfSchool = req.query.strategy;
	const idOfSchool = req.query.schoolId;

	const oauthSystemsResponse = await getOauthSystems(req);
	const oauthSystems = oauthSystemsResponse.data || [];

	res.render('authentication/login', {
		pageTitle: res.$t('home.header.link.login'),
		schools: filterSchoolsWithLdapLogin(schools),
		systems: [],
		oauthSystems,
		oauthErrorLogout,
		hideMenu: true,
		redirect,
		idOfSchool,
		showAlerts: true,
		showLoginAndRegisterButtons: false,
		strategyOfSchool,
	});
};

router.get('/loginRedirect', (req, res, next) => {
	authHelper.isAuthenticated(req)
		.then((isAuthenticated) => {
			if (isAuthenticated) {
				redirectAuthenticated(req, res);
			} else {
				res.redirect('/login');
			}
		})
		.catch(next);
});

router.all('/login/', async (req, res, next) => {
	authHelper.isAuthenticated(req)
		.then(async (isAuthenticated) => {
			if (isAuthenticated) {
				redirectAuthenticated(req, res);
			} else {
				await renderLogin(req, res);
			}
		})
		.catch(next);
});

router.all('/login/superhero/', async (req, res, next) => {
	res.locals.notification = {
		type: 'danger',
		message: res.$t('login.text.superheroForbidden'),
		statusCode: 401,
		timeToWait: Configuration.get('LOGIN_BLOCK_TIME'),
	};

	await renderLogin(req, res)
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

		if (consentStatus === 'ok' && haveBeenUpdated === false && (user.preferences || {}).firstLogin) {
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
