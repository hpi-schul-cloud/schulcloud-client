const jwt = require('jsonwebtoken');
const { Configuration } = require('@schul-cloud/commons');

const api = require('../api');
const permissionsHelper = require('./permissions');
const { NODE_ENV, SW_ENABLED, LOGIN_BLOCK_TIME } = require('../config/global');
const logger = require('./logger');

const rolesDisplayName = {
	teacher: 'Lehrer',
	student: 'Schüler',
	administrator: 'Administrator',
	superhero: 'Schul-Cloud Admin',
	demo: 'Demo',
	demoTeacher: 'Demo',
	demoStudent: 'Demo',
	helpdesk: 'Helpdesk',
	betaTeacher: 'Beta',
	expert: 'Experte',
};

const clearCookie = async (req, res, options = { destroySession: false }) => {
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
	// this is deprecated and only used for cookie removal from now on,
	// and can be removed after one month (max cookie lifetime from life systems)
	if (res.locals && res.locals.domain) {
		res.clearCookie('jwt', { domain: res.locals.domain });
	}
};

const isJWT = req => (req && req.cookies && req.cookies.jwt);

const isAuthenticated = (req) => {
	if (!isJWT(req)) {
		return Promise.resolve(false);
	}

	return api(req).post('/authentication', {
		json: {
			strategy: 'jwt',
			accessToken: req.cookies.jwt,
		},
	}).then(() => true).catch(() => false);
};

const populateCurrentUser = (req, res) => {
	let payload = {};
	if (isJWT(req)) {
		try {
			// eslint-disable-next-line prefer-destructuring
			payload = (jwt.decode(req.cookies.jwt, { complete: true }) || {}).payload;
			res.locals.currentPayload = payload;
		} catch (err) {
			logger.error('Broken JWT / JWT decoding failed', { error: err });
			return clearCookie(req, res, { destroySession: true })
				.catch((err) => { logger.error('clearCookie failed during jwt check', { error: err.toString() }); })
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
		return api(req).get(`/users/${payload.userId}`, {
			qs: {
				$populate: ['roles'],
			},
		}).then((data) => {
			res.locals.currentUser = data;
			setTestGroup(res.locals.currentUser);
			res.locals.currentRole = rolesDisplayName[data.roles[0].name];
			res.locals.roles = data.roles.map(({ name }) => name);
			res.locals.roleNames = data.roles.map(r => rolesDisplayName[r.name]);
			return api(req).get(`/schools/${res.locals.currentUser.schoolId}`, {
				qs: {
					$populate: ['federalState'],
				},
			}).then((data2) => {
				res.locals.currentSchool = res.locals.currentUser.schoolId;
				res.locals.currentSchoolData = data2;
				res.locals.currentSchoolData.isExpertSchool = data2.purpose === 'expert';
				return data2;
			});
		}).catch((e) => {
			// 400 for missing information in jwt, 401 for invalid jwt, not-found for deleted user
			if (e.statusCode === 400 || e.statusCode === 401 || e.error.className === 'not-found') {
				return clearCookie(req, res, { destroySession: true })
					.catch((err) => { logger.error('clearCookie failed during populateUser', { error: err.toString() }); })
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


const restrictSidebar = (req, res) => {
	res.locals.sidebarItems = res.locals.sidebarItems.filter((item) => {
		if (!item.permission) return true;

		const hasRequiredPermission = permissionsHelper.userHasPermission(res.locals.currentUser, item.permission);
		const hasExcludedPermission = permissionsHelper.userHasPermission(res.locals.currentUser,
			item.excludedPermission);
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
					.then(() => checkConsent(req, res))
					.then(() => restrictSidebar(req, res))
					.then(() => {
						next();
						return null;
					})
					.catch((err) => {
						if (err === 'firstLogin was not completed, redirecting...') {
							// print message?
							res.redirect('/firstLogin');
						} else {
							res.redirect(redirectUrl);
						}
					});
			} else {
				res.redirect(`${redirectUrl}?redirect=${req.originalUrl}`);
			}
		});
};

const login = (payload = {}, req, res, next) => {
	const { redirect } = payload;
	delete payload.redirect;
	return api(req).post('/authentication', { json: payload }).then((data) => {
		res.cookie('jwt', data.accessToken, {
			expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			httpOnly: false, // can't be set to true with nuxt client
			hostOnly: true,
			sameSite: 'strict', // restrict jwt access to our domain ressources only
			secure: NODE_ENV === 'production',
		});
		let redirectUrl = '/login/success';
		if (redirect) {
			redirectUrl = `${redirectUrl}?redirect=${redirect}`;
		}
		res.redirect(redirectUrl);
	}).catch((e) => {
		res.locals.notification = {
			type: 'danger',
			message: res.$t('login.text.loginFailed'),
			statusCode: e.statusCode,
			timeToWait: LOGIN_BLOCK_TIME || 15,
		};
		if (e.statusCode === 429) {
			res.locals.notification.timeToWait = e.error.data.timeToWait;
		}
		next(e);
	});
};

module.exports = {
	clearCookie,
	isJWT,
	authChecker,
	isAuthenticated,
	restrictSidebar,
	populateCurrentUser,
	login,
};
