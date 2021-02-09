/*
 * One Controller per layout view
 */

const express = require('express');
const feedr = require('feedr').create();

const router = express.Router();
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const redirectHelper = require('../helpers/redirect');

const { logger, formatError } = require('../helpers');

const getSelectOptions = (req, service, query) => api(req).get(`/${service}`, {
	qs: query,
}).then((data) => data.data);

// SSO Login

router.get('/tsp-login/', (req, res, next) => {
	const { ticket, redirect: redirectParam } = req.query;
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
	return authHelper.login({ strategy: 'tsp', ticket, redirect }, req, res, next);
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
			strategy, username, password, systemId, schoolId, redirect: validRedirect, privateDevice,
		}, req, res, errorSink);
	}
	return authHelper.login({
		strategy: 'local', username, password, redirect: validRedirect, privateDevice,
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

router.all('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return redirectAuthenticated(req, res);
		}

		const schoolsPromise = getSelectOptions(
			req, 'schools',
			{
				purpose: { $ne: 'expert' },
				$limit: false,
				$sort: 'name',
			},
		);
		return schoolsPromise.then((schools) => res.render('authentication/home', {
			schools,
			inline: true,
			systems: [],
		}));
	});
});

/*
	TODO: Should go over the error pipline and handle it, otherwise error can not logged. 
*/
const handleLoginFailed = (req, res) => authHelper.clearCookie(req, res)
	.then(() => getSelectOptions(req, 'schools', {
		purpose: { $ne: 'expert' },
		$limit: false,
		$sort: 'name',
	}).then((schools) => {
		const redirect = redirectHelper.getValidRedirect(req.query && req.query.redirect ? req.query.redirect : '');
		logger.warn(`User can not logged in. Redirect to ${redirect}`);
		res.render('authentication/login', {
			schools,
			systems: [],
			hideMenu: true,
			redirect,
		});
	}));

router.get('/loginRedirect', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return redirectAuthenticated(req, res);
		}
		if (Configuration.get('FEATURE_MULTI_LOGIN_INSTANCES')) {
			return res.redirect('/login-instances');
		}
		return res.redirect('/login');
	}).catch(next);
});

router.all('/login/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		if (isAuthenticated) {
			return redirectAuthenticated(req, res);
		}
		return handleLoginFailed(req, res);
	}).catch(next);
});

router.all('/login/superhero/', (req, res, next) => {
	res.locals.notification = {
		type: 'danger',
		message: res.$t('login.text.superheroForbidden'),
		statusCode: 401,
		timeToWait: Configuration.get('LOGIN_BLOCK_TIME'),
	};
	handleLoginFailed(req, res).catch(next);
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
}).catch(() => undefined); // TODO: fixme this is a very bad error catch
// so we can do proper redirecting and stuff :)

router.get('/login/success', authHelper.authChecker, async (req, res, next) => {
	if (res.locals.currentUser) {
		if (res.locals.currentPayload.forcePasswordChange) {
			return res.redirect('/forcePasswordChange');
		}

		const user = res.locals.currentUser;
		const redirectUrl = determineRedirectUrl(req);
		// check consent versions
		const { haveBeenUpdated, consentStatus } = await api(req)
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
	const { accountId, systemId } = (res.locals.currentPayload || {});

	ssoSchoolData(req, systemId).then((school) => {
		if (school === undefined) {
			const redirectUrl = determineRedirectUrl(req);
			res.redirect(redirectUrl);
		} else {
			res.redirect(`/registration/${school._id}/sso/${accountId}`);
		}
	});
	return null;
});

router.get('/login/systems/:schoolId', (req, res, next) => {
	api(req).get(`/schools/${req.params.schoolId}`, { qs: { $populate: ['systems'] } })
		.then((data) => {
			const systems = data.systems.filter((value) => value.type !== 'ldap' || value.ldapConfig.active === true);
			return res.send(systems);
		})
		.catch(next);
});

router.get('/logout/', (req, res, next) => {
	api(req).del('/authentication') // async, ignore result
		.catch((err) => { logger.error('error during logout.', formatError(err)); });
	return authHelper
		.clearCookie(req, res, { destroySession: true })
		.then(() => res.redirect('/'))
		.catch(next);
});

module.exports = router;
