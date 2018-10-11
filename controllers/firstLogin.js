const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

const consentFullfilled = (consent) => {
    return ((consent.privacyConsent && consent.termsOfUseConsent &&
        consent.thirdPartyConsent && consent.researchConsent));
};
const isStudent = (req, res, next) => {
    const roles = res.locals.currentUser.roles.map((role) => {return role.name;});
    return roles.includes("student");
};
const hasAccount = (req, res, next) => {
    return api(req).get('/consents', {
        qs: {
            userId: res.locals.currentUser._id
        }
    });
};

// firstLogin
router.get('/', async function (req, res, next) {
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
        }else if(res.locals.currentUser.age < 18 && !(res.locals.currentUser.preferences || {}).firstLogin){
            // 14-17
            sections.push("welcome_14-17");
        }else if(userConsent && (res.locals.currentUser.preferences || {}).firstLogin){
            // UE18 (schonmal eingeloggt)
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
    if(!res.locals.currentUser.birthday && isStudent(req, res, next)){
        submitPageIndex += 1;
        if(req.query.u14 == "true"){
            sections.push("birthdate_U14");
        }else if(req.query.ue14 == "true"){
            sections.push("birthdate_UE14");
        }else {
            sections.push("birthdate");
        }
    }

    // USER CONSENT
    if(!userConsent && (!res.locals.currentUser.age || res.locals.currentUser.age > 14)){
        submitPageIndex += 1;
        sections.push("consent");
    }

    // PASSWORD (wenn kein account oder (wenn kein perferences.firstLogin & schüler))
    const userHasAccount = await hasAccount(req,res,next);
    if( !userHasAccount
        || (!(res.locals.currentUser.preferences||{}).firstLogin
            && isStudent(req, res, next))){
        submitPageIndex += 1;
        sections.push("password");
    }

    // PARENT CONSENT (must be the submit page because of the pin validation!)
    if(consent.requiresParentConsent && !parentConsent){
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

// deprecated
router.get(['/U14','/existingU14'], function (req, res, next) {
    res.redirect("/firstlogin/?u14=true");
});
router.get(['/UE18','existingUE14'], function (req, res, next) {
    res.redirect("/firstlogin/?ue14=true");
});

router.get(['/14_17', '/existingGeb14', '/existingEmployee'], function (req, res, next) {
    res.redirect("/firstlogin/");
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

router.post('/submit', function (req, res, next) {

    if(req.body["password-1"] !== req.body["password-2"]){
        return Promise.reject(new Error("Die neuen Passwörter stimmen nicht überein."))
        .catch(err => {
            res.status(500).send(err.message);
        });
    }

    let accountId = res.locals.currentPayload.accountId;
    let accountUpdate = {};
    let accountPromise = Promise.resolve();
    let userUpdate = {};
    let userPromise;
    let consentUpdate = {};
    let consentPromise = Promise.resolve();
    
    if (req.body["password-1"]) {
        accountUpdate.password_verification = req.body.password_verification;
        accountUpdate.password = req.body["password-1"];
        accountPromise = api(req).patch('/accounts/' + accountId, {
            json: accountUpdate
        });
    }
    
    // wrong birthday object?
    if (req.body.studentBirthdate) {
        let dateArr = req.body.studentBirthdate.split(".");
        let userBirthday = new Date(`${dateArr[1]}.${dateArr[0]}.${dateArr[2]}`);
        if(userBirthday instanceof Date && isNaN(userBirthday)) {
            res.status(500).send("Bitte einen validen Geburtstag auswählen.");
        }
        userUpdate.birthday = userBirthday;
    }
    // malformed email?
    if (req.body["student-email"]) {
        var regex = RegExp("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
        if (!regex.test(req.body["student-email"])) {
            res.status(500).send("Bitte eine valide E-Mail-Adresse eingeben.");
        } else {
            userUpdate.email = req.body["student-email"];
        }
    }
    
    let preferences = res.locals.currentUser.preferences || {};
    preferences.firstLogin = true;
    userUpdate.preferences = preferences;

    userPromise = api(req).patch('/users/' + res.locals.currentPayload.userId, {
        json: userUpdate
    });

    if (req.body.privacyConsent || req.body.thirdPartyConsent || req.body.termsOfUseConsent || req.body.researchConsent) {
        consentPromise = api(req).get('/consents/', {
            qs: {userId: res.locals.currentPayload.userId}
        }).then(consent => {
            consentUpdate.form = 'digital';
            consentUpdate.privacyConsent = req.body.privacyConsent;
            consentUpdate.thirdPartyConsent = req.body.thirdPartyConsent;
            consentUpdate.termsOfUseConsent = req.body.termsOfUseConsent;
            consentUpdate.researchConsent = req.body.researchConsent;
            return api(req).patch('/consents/' + consent.data[0]._id, {
                json: {userConsent: consentUpdate}
            });
        });
        
    }

    return Promise.all([accountPromise, userPromise, consentPromise])
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            res.status(500).send((err.error || err).message || "Ein Fehler ist bei der Verarbeitung der FirstLogin Daten aufgetreten.");
        });
});

module.exports = router;
