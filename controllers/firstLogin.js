const express = require('express');
const authHelper = require('../helpers/authentication');
const api = require('../api');

const router = express.Router();

// secure routes
router.use(authHelper.authChecker);

const consentFullfilled = (consent) => {
	return (consent.privacyConsent && consent.termsOfUseConsent && consent.thirdPartyConsent);
};
const isStudent = (res) => {
	const roles = res.locals.currentUser.roles.map((role) => { return role.name; });
	return roles.includes('student');
};
const hasAccount = (req, res) => {
	return api(req).get('/consents', {
		qs: {
			userId: res.locals.currentUser._id
		}
	});
};

// firstLogin
router.get('/', async function (req, res, next) {
	if(
		!res.locals.currentUser.birthday && res.locals.currentRole == "Schüler" 
		&& !req.query.u14 && !req.query.ue14 && !req.query.ue16
	){
		return res.redirect("firstLogin/existing");
	}

	let sections = [];
	let submitPageIndex = 0;
	
	let consent = await api(req).get('/consents', {
			qs: {
				userId: res.locals.currentUser._id
			}
		});
	if(consent.data.length < 1){ consent = undefined;}
	else{
		consent = consent.data[0];
	}

	let userConsent = consentFullfilled((consent||{}).userConsent || {});
	let parentConsent = consentFullfilled(((consent||{}).parentConsents || [undefined])[0] || {});

	// WELCOME
	submitPageIndex += 1;
	if(res.locals.currentUser.birthday){
		if(res.locals.currentUser.age < 14){
			// U14
			sections.push("welcome");
		}else if(res.locals.currentUser.age < 16 && !(res.locals.currentUser.preferences || {}).firstLogin){
			// 14-15
			sections.push("welcome_14-15");
		}else if(userConsent && (res.locals.currentUser.preferences || {}).firstLogin){
			// UE16 (schonmal eingeloggt)
			sections.push("welcome_existing");
		}else if(!userConsent && parentConsent && (res.locals.currentUser.preferences || {}).firstLogin){
			// GEB 14
			sections.push("welcome_existing_geb14");
		}else{
			// default fallback
			sections.push("welcome");
		}
	}else{
		// old existing users or teachers/admins
		sections.push("welcome_existing");
	}

	// EMAIL
	submitPageIndex += 1;
	sections.push("email");

	// BIRTHDATE
	if(!res.locals.currentUser.birthday && isStudent(res)){
		submitPageIndex += 1;
		if(req.query.u14 == "true"){
			sections.push("birthdate_U14");
		}else if(req.query.ue14 == "true"){
			sections.push("birthdate_UE14");
		}else if(req.query.ue16 == "true"){
			sections.push("birthdate_UE16");
		}else {
			sections.push("birthdate");
		}
	}

	// USER CONSENT
	if(
		!userConsent && 
		((!res.locals.currentUser.age && !req.query.u14)|| res.locals.currentUser.age >= 14)
	){
		submitPageIndex += 1;
		sections.push("consent");
	}

	// PASSWORD (wenn kein account oder (wenn kein perferences.firstLogin & schüler))
	const userHasAccount = await hasAccount(req,res,next);
	if( !userHasAccount
		|| (!(res.locals.currentUser.preferences||{}).firstLogin && isStudent(res)) ){
		submitPageIndex += 1;
		sections.push("password");
	}

	// PARENT CONSENT (must be the submit page because of the pin validation!)
	if((req.query.u14 || req.query.ue14 || consent.requiresParentConsent) && !parentConsent){
		submitPageIndex += 4;
		sections.push("parent_intro");
		sections.push("parent_data");
		sections.push("parent_consent");
		sections.push("pin");
	}

	// THANKS
	sections.push("thanks");

	res.render('firstLogin/firstLogin', {
		title: 'Willkommen - Erster Login',
		hideMenu: true,
		sso:(res.locals.currentPayload||{}).systemId ? true : false,

		sections: sections.map((name) => {
			return "firstLogin/sections/" + name;
		}),
		submitPageIndex
	});
});

// submit & error handling
router.get('/existing', function (req, res, next) {
	res.render('firstLogin/firstLoginExistingUser', {
		title: 'Willkommen - Erster Login für bestehende Nutzer',
		hideMenu: true
	});
});

router.get('/consentError', function (req, res, next) {
	res.render('firstLogin/consentError');
});

router.post(['/submit', '/submit/sso'], async function (req, res, next) {
	return api(req).post('/firstLogin/', {json: req.body})
		.then(() => {
			res.sendStatus(200);
		})
		.catch(err => {
			res.status(500).send((err.error || err).message || "Ein Fehler ist bei der Verarbeitung der FirstLogin Daten aufgetreten.");
		});
});

module.exports = router;
