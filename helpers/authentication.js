const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passwordGenerator = require('generate-password');

const { Configuration } = require('@hpi-schul-cloud/commons');

const api = require('../api');
const permissionsHelper = require('./permissions');
const wordlist = require('../static/other/wordlist');

const {
	SW_ENABLED,
	MINIMAL_PASSWORD_LENGTH,
} = require('../config/global');
const logger = require('./logger');
const { formatError } = require('./logFilter');

const { setCookie } = require('./cookieHelper');
const redirectHelper = require('./redirect');
const renameIdsInSchool = require('./schoolHelper');

const rolesDisplayName = {
	teacher: 'Lehrer',
	student: 'Schüler',
	administrator: 'Administrator',
	superhero: 'Schul-Cloud Admin',
	helpdesk: 'Helpdesk',
	betaTeacher: 'Beta',
	expert: 'Experte',
};

const USER_FORCED_TO_CHANGE_PASSWORD_REJECT = 'USER_FORCED_TO_CHANGE_PASSWORD_REJECT';

const generatePassword = () => {
	const passphraseParts = [];

	// iterate 3 times, to add 3 password parts
	[1, 2, 3].forEach(() => {
		passphraseParts.push(
			wordlist[crypto.randomBytes(2)
				.readUInt16LE(0) % wordlist.length],
		);
	});
	return passphraseParts.join(' ');
};

const generateConsentPassword = () => passwordGenerator.generate({
	length: MINIMAL_PASSWORD_LENGTH,
	numbers: true,
	lowercase: true,
	uppercase: true,
	strict: true,
});

const clearCookies = async (req, res, options = { destroySession: false }) => {
	if (options.destroySession && req.session && req.session.destroy) {
		await new Promise((resolve, reject) => {
			req.session.destroy((err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	res.clearCookie('jwt');
	res.clearCookie('isLoggedIn');
};

const etherpadCookieHelper = (etherpadSession, padId, res) => {
	const encodedPadId = encodeURI(padId);
	const padPath = Configuration.get('ETHERPAD__PAD_PATH');
	setCookie(res, 'sessionID', etherpadSession.data.sessionID, {
		path: `${padPath}/${encodedPadId}`,
		expires: new Date(etherpadSession.data.validUntil * 1000),
	});
};

const isJWT = (req) => (req && req.cookies && req.cookies.jwt);

const isAuthenticated = (req) => {
	if (!isJWT(req)) {
		return Promise.resolve(false);
	}

	return api(req)
		.post('/authentication', {
			json: {
				strategy: 'jwt',
				accessToken: req.cookies.jwt,
			},
		})
		.then(() => true)
		.catch(() => false);
};

const populateCurrentUser = async (req, res) => {
	async function setExternalSystemFromJwt(decodedJwt) {
		if (!('systemId' in decodedJwt) && !decodedJwt.systemId) {
			return;
		}

		try {
			const response = await api(req, { version: 'v3' }).get(`/systems/public/${decodedJwt.systemId}`);
			const hasEndSessionEndpoint = 'oauthConfig' in response
				&& 'endSessionEndpoint' in response.oauthConfig
				&& response.oauthConfig.endSessionEndpoint;

			res.locals.isExternalLogoutAllowed = Configuration.get('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')
				&& hasEndSessionEndpoint;
			res.locals.systemName = response.displayName;
		} catch (err) {
			const metadata = { error: err.toString() };
			logger.error('Unable to find out the external login system used by user', metadata);
		}
	}

	let payload = {};
	if (isJWT(req)) {
		try {
			// eslint-disable-next-line prefer-destructuring
			payload = (jwt.decode(req.cookies.jwt, { complete: true }) || {}).payload;
			res.locals.currentPayload = payload;
		} catch (err) {
			logger.error('Broken JWT / JWT decoding failed', formatError(err));
			return clearCookies(req, res, { destroySession: true })
				.catch((err) => {
					logger.error('clearCookie failed during jwt check', formatError(err));
				})
				.finally(() => res.redirect('/'));
		}
	}

	// separates users in two groups for AB testing
	function setTestGroup(user) {
		if (SW_ENABLED) {
			const lChar = user._id.substr(user._id.length - 1);
			const group = parseInt(lChar, 16) % 2 ? 1 : 0;
			user.testGroup = group;
		} else {
			user.testGroup = 0;
		}
	}

	if (payload && payload.userId) {
		await setExternalSystemFromJwt(payload);

		if (res.locals.currentUser && res.locals.currentSchoolData) {
			return Promise.resolve(res.locals.currentSchoolData);
		}
		return Promise.all([
			api(req)
				.get(`/users/${payload.userId}`),
			api(req)
				.get(`/roles/user/${payload.userId}`),
		])
			.then(([user, roles]) => {
				const data = {
					...user,
					roles,
					permissions: roles.reduce((acc, role) => [...new Set(acc.concat(role.permissions))], []),
				};
				res.locals.currentUser = data;
				setTestGroup(res.locals.currentUser);
				res.locals.currentRole = rolesDisplayName[data.roles[0].name];
				res.locals.roles = data.roles.map(({ name }) => name);
				res.locals.roleNames = data.roles.map((r) => rolesDisplayName[r.name]);
				return api(req, { version: 'v3' }).get(`/school/id/${res.locals.currentUser.schoolId}`)
					.then((data2) => {
						res.locals.currentSchool = res.locals.currentUser.schoolId;
						res.locals.currentSchoolData = renameIdsInSchool(data2);
						res.locals.currentSchoolData.isExpertSchool = data2.purpose === 'expert';
						return data2;
					});
			})
			.catch((e) => {
			// 400 for missing information in jwt, 401 for invalid jwt, not-found for deleted user
				if (e.statusCode === 400 || e.statusCode === 401 || e.error.className === 'not-found') {
					return clearCookies(req, res, { destroySession: true })
						.catch((err) => {
							const meta = { error: err.toString() };
							logger.error('clearCookie failed during populateUser', meta);
						})
						.finally(() => res.redirect('/'));
				}
				throw e;
			});
	}

	return Promise.resolve();
};

const checkConsent = (req, res) => {
	if (
		((res.locals.currentUser || {}).preferences || {}).firstLogin	// do not exist if 3. system login
		|| req.path.startsWith('/login/success')
		|| req.baseUrl.startsWith('/firstLogin')) {
		return Promise.resolve();
	}
	// eslint-disable-next-line prefer-promise-reject-errors
	return Promise.reject('firstLogin was not completed, redirecting...');
};

const checkSuperhero = (req, res) => {
	if (!(res.locals.roles || []).includes('superhero')) {
		return Promise.resolve();
	}

	// eslint-disable-next-line prefer-promise-reject-errors
	return Promise.reject('superhero access forbidden, redirecting...');
};

const checkIfUserIsForcedToChangePassword = (req, res) => {
	if (!res.locals.currentUser.forcePasswordChange
		|| req.baseUrl.startsWith('/forcePasswordChange')
		|| !((res.locals.currentUser || {}).preferences || {}).firstLogin) {
		return Promise.resolve();
	}
	// eslint-disable-next-line prefer-promise-reject-errors
	return Promise.reject(USER_FORCED_TO_CHANGE_PASSWORD_REJECT);
};

const restrictSidebar = (req, res) => {
	// If sidebarItems do not exist, render without avaible menü points.
	// It do not affect authentication logins and so on.
	if (!res.locals.sidebarItems) {
		res.locals.sidebarItems = [];
	}
	res.locals.sidebarItems = res.locals.sidebarItems.filter((item) => {
		if (!item.permission) return true;

		const hasRequiredPermission = permissionsHelper.userHasPermission(res.locals.currentUser, item.permission);
		let hasExcludedPermission = false;
		if (Array.isArray(item.excludedPermission)) {
			hasExcludedPermission = item.excludedPermission
				.reduce((acc, perm) => {
					if (acc === true) return true;
					return permissionsHelper.userHasPermission(res.locals.currentUser, perm);
				},
				false);
		} else {
			hasExcludedPermission = permissionsHelper.userHasPermission(res.locals.currentUser,
				item.excludedPermission);
		}

		return hasRequiredPermission && !hasExcludedPermission;
		// excludedPermission is used to prevent the case that an Admin has both: Verwaltung and Administration
	});
};

const authChecker = (req, res, next) => {
	isAuthenticated(req)
		.then((isAuthenticated2) => {
			const redirectUrl = Configuration.get('NOT_AUTHENTICATED_REDIRECT_URL');

			if (isAuthenticated2) {
			// fetch user profile
				populateCurrentUser(req, res)
					.then(() => checkSuperhero(req, res))
					.then(() => checkConsent(req, res))
					.then(() => restrictSidebar(req, res))
					.then(() => checkIfUserIsForcedToChangePassword(req, res))
					.then(() => {
						next();
						return null;
					})
					.catch((err) => {
						if (err === 'firstLogin was not completed, redirecting...') {
							// print message?
							res.redirect('/firstLogin');
						} else if (err === 'superhero access forbidden, redirecting...') {
							res.redirect('/login/superhero');
						} else if (err === USER_FORCED_TO_CHANGE_PASSWORD_REJECT) {
							res.redirect('/forcePasswordChange');
						} else {
							res.redirect(redirectUrl);
						}
					});
			} else {
				res.redirect(`${redirectUrl}?redirect=${req.originalUrl}`);
			}
		});
};

const setLoginCookies = (res, token) => {
	setCookie(res, 'jwt', token);

	// This second cookie "isLoggedIn" is set because the cookie with the JWT shall be set to httpOnly perspectively.
	// Thus we need another cookie to check from javascript if the user is logged in.
	setCookie(res, 'isLoggedIn', true);
};

const loginSuccessfulHandler = (res, redirect) => (data) => {
	setLoginCookies(res, data.accessToken);

	let redirectUrl = '/login/success';
	if (redirect) {
		redirectUrl = `${redirectUrl}?redirect=${redirect}`;
	}
	res.redirect(redirectUrl);
};

const mapErrorToTranslationKey = (error) => {
	switch (error.type) {
		case 'ACCESS_DENIED':
			return 'login.text.accessDenied';
		case 'USER_NOT_FOUND':
			return 'login.text.userNotFound';
		case 'SCHOOL_IN_MIGRATION':
			return 'login.text.schoolInMigration';
		case 'USER_NOT_FOUND_AFTER_PROVISIONING':
			return 'login.text.userNotFoundAfterProvisioning';
		case 'MULTIPLE_USERS_FOUND':
			return 'login.text.multipleUsersFound';
		case 'USER_ACCOUNT_DEACTIVATED':
			return 'login.text.userAccountDeactivated';
		case 'EXTERNAL_USER_ROLE_UNKNOWN':
			return 'login.text.externalUserRoleUnknown';
		case 'SCHOOL_MISSING':
			return 'login.text.unprocessableData';
		default:
			return 'login.text.loginFailed';
	}
};

const loginErrorHandler = (res, next) => (e) => {
	res.locals.notification = {
		type: 'danger',
		message: res.$t('login.text.loginFailed'),
		statusCode: e.statusCode,
		timeToWait: Configuration.get('LOGIN_BLOCK_TIME'),
	};

	// Email Domain Blocked
	if (e.statusCode === 400 && e.error.message === 'EMAIL_DOMAIN_BLOCKED') {
		res.locals.notification.message = res.$t('global.text.emailDomainBlocked');
	}

	// Too Many Requests
	if (e.statusCode === 429) {
		res.locals.notification.timeToWait = e.error.data.timeToWait;
	}

	// User account deactivated
	if (e.statusCode === 401 && e.error.type === 'USER_ACCOUNT_DEACTIVATED') {
		res.locals.notification.message = res.$t('login.text.userAccountDeactivated');
	}

	next(e);
};

const setErrorNotification = (res, req, error, systemName) => {
	let message = res.$t(mapErrorToTranslationKey(error), {
		systemName,
		shortTitle: res.locals.theme.short_title,
	});

	// Email Domain Blocked
	if (error.code === 400 && error.message === 'EMAIL_DOMAIN_BLOCKED') {
		message = res.$t('global.text.emailDomainBlocked');
	}

	// Too Many Requests
	let timeToWait = Configuration.get('LOGIN_BLOCK_TIME');
	if (error.code === 429 && error.data.timeToWait) {
		timeToWait = error.data.timeToWait;
	}

	req.session.notification = {
		type: 'danger',
		statusCode: error.code || 500,
		message,
		timeToWait,
	};
};

const handleLoginError = async (req, res, error, postLoginRedirect, strategy, systemName, provider) => {
	setErrorNotification(res, req, error, systemName);

	if (req.session.oauth2State) {
		delete req.session.oauth2State;
	}

	await clearCookies(req, res);

	const queryString = new URLSearchParams();
	if (postLoginRedirect) {
		queryString.append('redirect', redirectHelper.getValidRedirect(postLoginRedirect));
	}

	if (strategy === 'ldap' || strategy === 'email') {
		queryString.append('strategy', strategy);
	} else if (strategy === 'oauth2' && provider) {
		req.session.oauth2Logout = {
			provider,
		};
	}

	const redirect = redirectHelper.joinPathWithQuery('/login', queryString.toString());

	res.redirect(redirect);
};

const login = (payload = {}, req, res, next) => {
	const { redirect } = payload;
	delete payload.redirect;
	if (payload.strategy === 'local') {
		return api(req, { version: 'v3' })
			.post('/authentication/local', { json: payload })
			.then(loginSuccessfulHandler(res, redirect))
			.catch(loginErrorHandler(res, next));
	}
	if (payload.strategy === 'ldap') {
		return api(req, { version: 'v3' })
			.post('/authentication/ldap', { json: payload })
			.then(loginSuccessfulHandler(res, redirect))
			.catch(loginErrorHandler(res, next));
	}
	return api(req, { version: 'v1' })
		.post('/authentication', { json: payload })
		.then(loginSuccessfulHandler(res, redirect))
		.catch(loginErrorHandler(res, next));
};

const oauth2RedirectUri = new URL('/login/oauth2-callback', Configuration.get('HOST')).toString();

const getAuthenticationUrl = (oauthConfig, state, migration, loginHint) => {
	const authenticationUrl = new URL(oauthConfig.authEndpoint);

	authenticationUrl.searchParams.append('client_id', oauthConfig.clientId);
	authenticationUrl.searchParams.append('redirect_uri', oauth2RedirectUri);
	authenticationUrl.searchParams.append('response_type', oauthConfig.responseType);
	authenticationUrl.searchParams.append('scope', oauthConfig.scope);
	authenticationUrl.searchParams.append('state', state);

	if (loginHint) {
		authenticationUrl.searchParams.append('login_hint', loginHint);
	}

	if (migration) {
		authenticationUrl.searchParams.append('prompt', 'login');
	}

	if (oauthConfig.idpHint) {
		authenticationUrl.searchParams.append('kc_idp_hint', oauthConfig.idpHint);
	}

	return authenticationUrl.toString();
};

const requestLogin = (req, strategy, payload = {}) => {
	switch (strategy) {
		case 'local':
			return api(req, { version: 'v3' })
				.post('/authentication/local', { json: payload });
		case 'ldap':
			return api(req, { version: 'v3' })
				.post('/authentication/ldap', { json: payload });
		case 'oauth2':
			return api(req, { version: 'v3' })
				.post('/authentication/oauth2', { json: payload });
		default:
			return api(req, { version: 'v1' })
				.post('/authentication', { json: { strategy, ...payload } });
	}
};

const getMigrationStatus = async (req, res, userId, accessToken) => {
	const { data } = await api(req, {
		version: 'v3',
		accessToken,
	})
		.get('/user-login-migrations', {
			qs: {
				userId,
			},
		});

	const migration = Array.isArray(data) && data.length > 0 ? data[0] : null;

	return migration;
};

const loginUser = async (req, res, strategy, payload, postLoginRedirect) => {
	const loginResponse = await requestLogin(req, strategy, payload);

	const { accessToken } = loginResponse;

	const currentUser = jwt.decode(accessToken);

	const migration = await getMigrationStatus(req, res, currentUser.userId, accessToken);

	setLoginCookies(res, accessToken);

	if (migration && !migration.closedAt) {
		return {
			login: loginResponse,
			redirect: '/migration',
		};
	}

	const queryString = new URLSearchParams();

	if (postLoginRedirect) {
		queryString.append('redirect', redirectHelper.getValidRedirect(postLoginRedirect));
	}

	const redirect = redirectHelper.joinPathWithQuery('/login/success', queryString.toString());

	return {
		login: loginResponse,
		redirect,
	};
};

const getLogoutUrl = (req, res, logoutEndpoint, idTokenHint, redirect) => {
	if (!logoutEndpoint) {
		logger.info('Logout failed. Missing logout endpoint.');
	}

	const logoutUrl = new URL(logoutEndpoint);
	logoutUrl.searchParams.append('id_token_hint', idTokenHint);

	const postLoginRedirect = `${Configuration.get('HOST')}${redirect || '/dashboard'}`;
	logoutUrl.searchParams.append('post_logout_redirect_uri', postLoginRedirect);

	return logoutUrl.toString();
};

// eslint-disable-next-line consistent-return
const migrateUser = async (req, res, payload) => {
	const queryString = new URLSearchParams({
		targetSystem: payload.systemId,
	});

	let redirect = redirectHelper.joinPathWithQuery('/migration/success', queryString.toString());

	try {
		await api(req, { version: 'v3' })
			.post('/user-login-migrations/migrate-to-oauth2', {
				json: payload,
			});
	} catch (errorResponse) {
		if (errorResponse.error && errorResponse.error.details) {
			logger.error('Migration failed');

			const { details } = errorResponse.error;

			if (details.sourceSchoolNumber && details.targetSchoolNumber) {
				queryString.append('sourceSchoolNumber', details.sourceSchoolNumber);
				queryString.append('targetSchoolNumber', details.targetSchoolNumber);
			} else if (details.multipleUsersFound) {
				queryString.append('multipleUsersFound', details.multipleUsersFound);
			}
		}

		redirect = redirectHelper.joinPathWithQuery('/migration/error', queryString.toString());
	}

	await clearCookies(req, res);

	return redirect;
};

module.exports = {
	clearCookies,
	isJWT,
	authChecker,
	isAuthenticated,
	restrictSidebar,
	populateCurrentUser,
	login,
	etherpadCookieHelper,
	generatePassword,
	generateConsentPassword,
	oauth2RedirectUri,
	getAuthenticationUrl,
	loginUser,
	migrateUser,
	handleLoginError,
	getLogoutUrl,
};
