const express = require('express');
const { Configuration } = require('@schul-cloud/commons');

const router = express.Router();
const api = require('../api');

const { HOST, NODE_ENV, CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../config/global');
const setTheme = require('../helpers/theme');
const authHelper = require('../helpers/authentication');

let invalid = false;
const isProduction = NODE_ENV === 'production';
let nonSecure;

const resetThemeForPrivacyDocuments = async (req, res) => {
	res.locals.currentSchoolData = await api(req).get(`registrationSchool/${req.params.classOrSchoolId}`);
	setTheme(res);
};

const checkSecure = (url) => {
	if ((!url.includes('sso')) && (!url.includes('importHash'))) {
		nonSecure = true;
	}
};

const checkValidRegistration = async (req) => {
	if (req.query.importHash) {
		const existingUser = await api(req).get(`/users/linkImport/${req.query.importHash}`);
		if (!existingUser.userId) {
			return true;
		}
	}
	return false;
};

/*
 * Warnings for users who wan't to use the old register version if not teacher
 */
router.get(['/register', '/register/*'], (req, res, next) => res.render('registration/deprecated_warning'));

/*
 * EzD Dataprivacy Routes
 */
router.post('/registration/pincreation', (req, res, next) => {
	if (req.body && req.body.email) {
		return api(req).post('/registrationPins/', {
			json: {
				email: req.body.email,
				mailTextForRole: req.body.mailTextForRole,
			},
		}).then((result) => {
			res.sendStatus((result || {}).status || 200);
		}).catch(next);
	}
	return res.sendStatus(400);
});

router.post(['/registration/submit', '/registration/submit/:sso/:accountId'], (req, res, next) => {
	// normalize form data
	req.body.roles = Array.isArray(req.body.roles) ? req.body.roles : [req.body.roles];

	let skipConsent = false;
	if (req.body.roles.length > 0) {
		skipConsent = req.body.roles.some((role) => {
			let roleName = role.name;
			if (roleName === 'teacher' || roleName === 'administrator') {
				roleName = 'employee';
			}
			return Configuration.get('SKIP_CONDITIONS_CONSENT').includes(roleName);
		});
	}

	return api(req)
		.post('/registration/', {
			json: req.body,
		})
		.then((response) => {
			const eMailAdresses = [response.user.email];
			if (response.parent) {
				eMailAdresses.push(response.parent.email);
			}
			const consentText = skipConsent ? ''
				: `Wenn du zwischen 14 und ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre alt bist,
bestätige bitte zusätzlich die Einverständniserklärung,
damit du die ${res.locals.theme.short_title} nutzen kannst.`;

			eMailAdresses.forEach((eMailAdress) => {
				let passwordText = '';
				let studentInfotext = '';
				if (req.body.roles.includes('student')) {
					passwordText = `Startpasswort: ${req.body.password_1}`;
					studentInfotext = `Für Schüler: Nach dem ersten Login musst du ein persönliches Passwort festlegen.
${consentText}`;
				}
				return api(req).post('/mails/', {
					json: {
						email: eMailAdress,
						subject: `Willkommen in der ${res.locals.theme.title}!`,
						headers: {},
						content: {
							text: `Hallo ${response.user.firstName}
mit folgenden Anmeldedaten kannst du dich in der ${res.locals.theme.title} einloggen:
Adresse: ${req.headers.origin || HOST}
E-Mail: ${response.user.email}
${passwordText}
${studentInfotext}
Viel Spaß und einen guten Start wünscht dir dein
${res.locals.theme.short_title}-Team`,
						},
					},
				});
			});
		})
		.then(() => {
			if (req.params.sso) {
				res.cookie(
					'jwt',
					req.cookies.jwt,
					{
						expires: new Date(Date.now() - 100000),
						httpOnly: false,
						hostOnly: true,
						secure: isProduction,
					},
				);
			}
		})
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			let message = 'Hoppla, ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.';
			const customMessage = (err.error || {}).message || err.message;
			if (customMessage) { message = customMessage; }
			if (err && err.code) {
				if (err.code === 'ESOCKETTIMEDOUT') {
					message = `Leider konnte deine Registrierung nicht abgeschlossen werden.
					Bitte versuche es erneut.`;
				}
			}
			return res.status(500).send(message);
		});
});

router.get(['/registration/:classOrSchoolId/byparent', '/registration/:classOrSchoolId/byparent/:sso/:accountId'],
	async (req, res, next) => {

		if (!RegExp('^[0-9a-fA-F]{24}$').test(req.params.classOrSchoolId)) {
			if (req.params.sso && !RegExp('^[0-9a-fA-F]{24}$').test(req.params.accountId)) {
				return res.sendStatus(400);
			}
		}
		checkSecure(req.url);

		const user = {};
		user.importHash = req.query.importHash;
		user.classOrSchoolId = req.params.classOrSchoolId;
		user.sso = req.params.sso === 'sso';
		user.account = req.params.accountId || '';

		invalid = await checkValidRegistration(req);

		await resetThemeForPrivacyDocuments(req, res);

		if (user.importHash) {
			const existingUser = await api(req).get(`/users/linkImport/${user.importHash}`);
			Object.assign(user, existingUser);
		}

		const needConsent = !Configuration.get('SKIP_CONDITIONS_CONSENT').includes('student');
		const sectionNumber = needConsent ? 5 : 3;

		return res.render('registration/registration-parent', {
			title: 'Registrierung - Eltern',
			password: authHelper.generatePassword(),
			hideMenu: true,
			user,
			needConsent,
			sectionNumber,
			CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
			invalid,
			nonSecure,
		});
	});

router.get(['/registration/:classOrSchoolId/bystudent', '/registration/:classOrSchoolId/bystudent/:sso/:accountId'],
	async (req, res, next) => {
		if (!RegExp('^[0-9a-fA-F]{24}$').test(req.params.classOrSchoolId)) {
			if (req.params.sso && !RegExp('^[0-9a-fA-F]{24}$').test(req.params.accountId)) {
				return res.sendStatus(400);
			}
		}
		checkSecure(req.url);

		const user = {};
		user.importHash = req.query.importHash;
		user.classOrSchoolId = req.params.classOrSchoolId;
		user.sso = req.params.sso === 'sso';
		user.account = req.params.accountId || '';

		invalid = await checkValidRegistration(req);

		await resetThemeForPrivacyDocuments(req, res);

		if (user.importHash) {
			const existingUser = await api(req).get(`/users/linkImport/${user.importHash}`);
			Object.assign(user, existingUser);
		}

		const needConsent = !Configuration.get('SKIP_CONDITIONS_CONSENT').includes('student');
		const sectionNumber = needConsent ? 4 : 3;

		return res.render('registration/registration-student', {
			title: 'Registrierung - Schüler*',
			password: authHelper.generatePassword(),
			hideMenu: true,
			user,
			needConsent,
			sectionNumber,
			CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
			invalid,
			nonSecure,
		});
	});

router.get(['/registration/:classOrSchoolId/:byRole'], async (req, res, next) => {
	if (!RegExp('^[0-9a-fA-F]{24}$').test(req.params.classOrSchoolId)) {
		if (req.params.sso && !RegExp('^[0-9a-fA-F]{24}$').test(req.params.accountId)) {
			return res.sendStatus(400);
		}
	}
	checkSecure(req.url);

	const user = {};
	user.importHash = req.query.importHash || req.query.id; // req.query.id is deprecated
	user.classOrSchoolId = req.params.classOrSchoolId;

	invalid = await checkValidRegistration(req);

	await resetThemeForPrivacyDocuments(req, res);

	if (user.importHash) {
		const existingUser = await api(req).get(`/users/linkImport/${user.importHash}`);
		Object.assign(user, existingUser);
	}

	let needConsent = true;
	let sectionNumber = 5;

	let roleText;
	if (req.params.byRole === 'byemployee') {
		roleText = 'Lehrer*/Admins*';
		if (Configuration.get('SKIP_CONDITIONS_CONSENT').includes('employee')) {
			needConsent = false;
			sectionNumber = 4;
		}
	} else {
		delete user.firstName;
		delete user.lastName;
		roleText = 'Experte*';
	}

	return res.render('registration/registration-employee', {
		title: `Registrierung - ${roleText}`,
		hideMenu: true,
		user,
		needConsent,
		sectionNumber,
		invalid,
		nonSecure,
	});
});

router.get(
	['/registration/:classOrSchoolId', '/registration/:classOrSchoolId/:sso/:accountId'],
	async (req, res, next) => {
		if (!RegExp('^[0-9a-fA-F]{24}$').test(req.params.classOrSchoolId)) {
			if (req.params.sso && !RegExp('^[0-9a-fA-F]{24}$').test(req.params.accountId)) {
				return res.sendStatus(400);
			}
		}
		checkSecure(req.url);

		invalid = await checkValidRegistration(req);

		await resetThemeForPrivacyDocuments(req, res);

		return res.render('registration/registration', {
			title: 'Herzlich willkommen bei der Registrierung',
			hideMenu: true,
			importHash: req.query.importHash || req.query.id, // req.query.id is deprecated
			classOrSchoolId: req.params.classOrSchoolId,
			sso: req.params.sso === 'sso',
			account: req.params.accountId || '',
			CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
			invalid,
			nonSecure,
		});
	},
);

module.exports = router;
