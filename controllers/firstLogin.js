const express = require('express');
const authHelper = require('../helpers/authentication');
const api = require('../api');

const router = express.Router();

// secure routes
router.use(authHelper.authChecker);

const consentFullfilled = consent => (consent.privacyConsent && consent.termsOfUseConsent && consent.thirdPartyConsent);
const isStudent = (res) => {
	const roles = res.locals.currentUser.roles.map(role => role.name);
	return roles.includes('student');
};
const hasAccount = (req, res) => api(req).get('/consents', {
	qs: {
		userId: res.locals.currentUser._id,
	},
});

const userHasNewPrivacyRules = async (user, consent, req) => {
	const dateOfPrivacyConsent = (consent.privacyConsent || {}).dateOfPrivacyConsent || user.createdAt;

	// check api for new privacy statements
	const response = await api(req).get('/privacy', {
		qs: {
			publishedAt: {
				$gt: dateOfPrivacyConsent,
			},
			$limit: 0,
		},
	});
	if (response.total !== 0) {
		return true;
	}
	return false;
};

// firstLogin
router.get('/', async (req, res, next) => {
	if (
		!res.locals.currentUser.birthday && res.locals.currentRole == 'Schüler'
		&& !req.query.u14 && !req.query.ue14 && !req.query.ue16
	) {
		return res.redirect('firstLogin/existing');
	}

	const sections = [];
	let submitPageIndex = 0;

	let consent = await api(req).get('/consents', {
		qs: {
			userId: res.locals.currentUser._id,
		},
	});
	if (consent.data.length < 1) { consent = undefined; } else {
		consent = consent.data[0];
	}

	const userConsent = consentFullfilled((consent || {}).userConsent || {});
	const parentConsent = consentFullfilled(((consent || {}).parentConsents || [undefined])[0] || {});

	// WELCOME
	submitPageIndex += 1;
	if (res.locals.currentUser.birthday) {
		if (res.locals.currentUser.age < 14) {
			// U14
			sections.push('welcome');
		} else if (res.locals.currentUser.age < 16 && !(res.locals.currentUser.preferences || {}).firstLogin) {
			// 14-15
			sections.push('welcome_14-15');
		} else if (userConsent && (res.locals.currentUser.preferences || {}).firstLogin) {
			// UE16 (schonmal eingeloggt)
			sections.push('welcome_existing');
		} else if (!userConsent && parentConsent && (res.locals.currentUser.preferences || {}).firstLogin) {
			// GEB 14
			sections.push('welcome_existing_geb14');
		} else {
			// default fallback
			sections.push('welcome');
		}
	} else {
		// old existing users or teachers/admins
		sections.push('welcome_existing');
	}

	// EMAIL
	submitPageIndex += 1;
	sections.push('email');

	// BIRTHDATE
	if (!res.locals.currentUser.birthday && isStudent(res)) {
		submitPageIndex += 1;
		if (req.query.u14 == 'true') {
			sections.push('birthdate_U14');
		} else if (req.query.ue14 == 'true') {
			sections.push('birthdate_UE14');
		} else if (req.query.ue16 == 'true') {
			sections.push('birthdate_UE16');
		} else {
			sections.push('birthdate');
		}
	}

	// USER CONSENT
	if (
		!userConsent
		&& ((!res.locals.currentUser.age && !req.query.u14) || res.locals.currentUser.age >= 14)
	) {
		submitPageIndex += 1;
		sections.push('consent');
	}

	// PASSWORD (wenn kein account oder (wenn kein perferences.firstLogin & schüler))
	const userHasAccount = await hasAccount(req, res, next);
	if (!userHasAccount
		|| (!(res.locals.currentUser.preferences || {}).firstLogin && isStudent(res))) {
		submitPageIndex += 1;
		sections.push('password');
	}

	// PARENT CONSENT (must be the submit page because of the pin validation!)
	if ((req.query.u14 || req.query.ue14 || consent.requiresParentConsent) && !parentConsent) {
		submitPageIndex += 4;
		sections.push('parent_intro');
		sections.push('parent_data');
		sections.push('parent_consent');
		sections.push('pin');
	}

	// NEW PRIVACY RULES
	if (await userHasNewPrivacyRules(res.locals.currentUser, consent, req)) {
		submitPageIndex += 1;
		sections.push('privacy_intro');
	}

	// THANKS
	sections.push('thanks');

	res.render('firstLogin/firstLogin', {
		title: 'Willkommen - Erster Login',
		hideMenu: true,
		sso: !!(res.locals.currentPayload || {}).systemId,

		sections: sections.map(name => `firstLogin/sections/${name}`),
		submitPageIndex,
	});
});

// submit & error handling
router.get('/existing', (req, res, next) => {
	res.render('firstLogin/firstLoginExistingUser', {
		title: 'Willkommen - Erster Login für bestehende Nutzer',
		hideMenu: true,
	});
});

router.get('/consentError', (req, res, next) => {
	res.render('firstLogin/consentError');
});

router.post(['/submit', '/submit/sso'], async (req, res, next) => api(req).post('/firstLogin/', { json: req.body })
	.then(() => {
		res.sendStatus(200);
	})
	.catch((err) => {
		res.status(500).send((err.error || err).message || 'Ein Fehler ist bei der Verarbeitung der FirstLogin Daten aufgetreten.');
	}));

module.exports = router;
