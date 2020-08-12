const { Configuration } = require('@schul-cloud/commons');
const express = require('express');
const showdown = require('showdown');
const _ = require('lodash');
const api = require('../api');
const authHelper = require('../helpers/authentication');

const converter = new showdown.Converter();

const { CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../config/global');

const router = express.Router();

// secure routes
router.use(authHelper.authChecker);

const consentFullfilled = (consent) => consent.privacyConsent && consent.termsOfUseConsent;
const isStudent = (res) => {
	const roles = res.locals.currentUser.roles.map((role) => role.name);
	return roles.includes('student');
};
const hasAccount = (req, res) => api(req).get('/consents', {
	qs: {
		userId: res.locals.currentUser._id,
	},
});

// firstLogin
router.get('/', async (req, res, next) => {
	const { currentUser } = res.locals;
	if (
		!currentUser.birthday && res.locals.currentRole === 'Schüler' // fixme identical to isStudent() here
		&& !req.query.u14 && !req.query.ue14 && !req.query.ue16
	) {
		return res.redirect('firstLogin/existing');
	}

	const sections = [];
	let submitPageIndex = 0;

	let skipConsent = currentUser.roles.length > 0;
	if (currentUser.roles.length > 0) {
		currentUser.roles.forEach((role) => {
			let roleName = role.name;
			if (roleName === 'teacher' || roleName === 'administrator') {
				roleName = 'employee';
			}
			skipConsent = skipConsent && Configuration.get('SKIP_CONDITIONS_CONSENT').includes(roleName);
		});
	}

	let consent = await api(req).get('/consents', {
		qs: {
			userId: currentUser._id,
		},
	});
	if (consent.data.length < 1) { consent = undefined; } else {
		consent = consent.data[0];
	}

	const userConsent = consentFullfilled((consent || {}).userConsent || {});
	const parentConsent = consentFullfilled(((consent || {}).parentConsents || [undefined])[0] || {});
	const {
		privacy = [], termsOfUse = [], haveBeenUpdated,
	} = await api(req).get(`/consents/${currentUser._id}/check/`);
	let updatedConsents = {};

	// if there is already a user or parent consent it may have been updated
	if (haveBeenUpdated) {
		// UPDATED CONSENTS SINCE LAST FULLFILMENT DATE
		console.log('------------------------haveBeenUpdated');
		updatedConsents = {
			privacy: {
				data: privacy,
				total: privacy.length,
			},
			termsOfUse: {
				data: termsOfUse,
				total: termsOfUse.length,
			},
			all: {
				data: privacy.concat(termsOfUse),
				total: termsOfUse.length + privacy.length,
			},
			haveBeenUpdated,
		};
		console.log('------------------------haveBeenUpdated', updatedConsents);
		updatedConsents.all.data.forEach((version) => {
			if (version.consentTypes.includes('privacy') && version.consentTypes.includes('termsOfUse')) {
				version.visualType = res.$t('login.headline.privacyAndTermsOfUse');
			} else {
				if (version.consentTypes.includes('privacy')) {
					version.visualType = res.$t('global.text.dataProtection');
				}
				if (version.consentTypes.includes('termsOfUse')) {
					version.visualType = res.$t('login.headline.onlyTermsOfUse');
				}
			}
			version.consentHTML = converter.makeHtml(version.consentText);
		});
		submitPageIndex += 1;
		sections.push('consent_updates');
	} else {
		// WELCOME
		submitPageIndex += 1;
		if (res.locals.currentUser.birthday) {
			if (res.locals.currentUser.age < 14) {
				// U14
				sections.push('welcome');
			} else if (consent.requiresParentConsent
				&& !(res.locals.currentUser.preferences || {}).firstLogin) {
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
		if (!res.locals.currentUser.source) {
			// only display the confirm email page if the user was not generated from an external source
			submitPageIndex += 1;
			sections.push('email');
		}

		// BIRTHDATE
		if (!res.locals.currentUser.birthday && isStudent(res)) {
			submitPageIndex += 1;
			if (req.query.u14 === 'true') {
				sections.push('birthdate_U14');
			} else if (req.query.ue14 === 'true') {
				sections.push('birthdate_UE14');
			} else if (req.query.ue16 === 'true') {
				sections.push('birthdate_UE16');
			} else {
				sections.push('birthdate');
			}
		}

		// USER CONSENT
		if (
			!skipConsent
			&& !userConsent
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
		if ((req.query.u14 || req.query.ue14 || consent.requiresParentConsent) && !parentConsent && !skipConsent) {
			submitPageIndex += 4;
			sections.push('parent_intro');
			sections.push('parent_data');
			sections.push('parent_consent');
			sections.push('pin');
		}
	}

	// THANKS
	sections.push('thanks');
	const privacyData = _.get(updatedConsents, 'privacy.data');
	const consentDataId = privacyData && privacyData.length > 0
		? privacyData[0].consentDataId : undefined;
	const schoolPrivacyLink = consentDataId ? `base64Files/${consentDataId}` : undefined;
	const renderObject = {
		title: res.$t('login.headline.firstLogin'),
		hideMenu: true,
		sso: !!(res.locals.currentPayload || {}).systemId,
		now: Date.now(),
		sections: sections.map((name) => `firstLogin/sections/${name}`),
		schoolPrivacyLink,
		submitPageIndex,
		userConsent,
		updatedConsents,
		CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
		roleNames: res.locals.roles,
	};

	if (haveBeenUpdated) {
		// default is 'Absenden'
		renderObject.submitLabel = res.$t('login.button.submitPrivacyPolicy');
	}

	// redirect to dashboard if we have only email to request
	if (sections.length === 3 && sections[1] === 'email' && (res.locals.currentUser.preferences || {}).firstLogin) {
		return res.redirect('/dashboard');
	}
	return res.render('firstLogin/firstLogin', renderObject);
});

router.get('/existing', (req, res, next) => {
	res.render('firstLogin/firstLoginExistingUser', {
		title: res.$t('login.headline.firstLoginExistingUser'),
		hideMenu: true,
		CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
	});
});

// submit & error handling
router.get('/consentError', (req, res, next) => {
	res.render('firstLogin/consentError');
});

router.post(['/submit', '/submit/sso'], async (req, res, next) => api(req).post('/firstLogin/', { json: req.body })
	.then(() => {
		res.sendStatus(200);
	})
	.catch((err) => {
		res.status(500).send(
			(err.error || err).message
			|| res.$t('login.text.errorFirstLogin'),
		);
	}));

module.exports = router;
