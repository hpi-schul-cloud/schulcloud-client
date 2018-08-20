const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    res.render('firstLogin/firstLogin', {
        title: 'Willkommen - Erster Login',
        hideMenu: true
    });
});
router.get('/14_17', function (req, res, next) {
    res.render('firstLogin/firstLogin14_17', {
        title: 'Willkommen - Erster Login (14 bis 17 Jahre)',
        hideMenu: true
    });
});
router.get('/U14', function (req, res, next) {
    res.render('firstLogin/firstLoginU14', {
        title: 'Willkommen - Erster Login',
        hideMenu: true
    });
});
router.get('/UE18', function (req, res, next) {
    res.render('firstLogin/firstLoginUE18', {
        title: 'Willkommen - Erster Login',
        hideMenu: true
    });
});
router.get('/existing', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingUser', {
        title: 'Willkommen - Erster Login für bestehende Nutzer',
        hideMenu: true
    });
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
    let userPromise = Promise.resolve();
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
            return Promise.reject("Fehler bei der Erkennung des ausgewählten Geburtstages. Bitte lade die Seite neu und starte erneut.");
        }
        userUpdate.birthday = userBirthday;
    }
    if (req.body["student-email"]) {
        var regex = RegExp("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
        if (!regex.test(hook.data.email)) {
            return Promise.reject(new errors.BadRequest('Bitte gib eine valide E-Mail Adresse an!'));
        }
        userUpdate.email = req.body["student-email"];
    }
    var preferences = res.locals.currentUser.preferences || {};
    preferences.firstLogin = true;
    userUpdate.preferences = preferences;

    userPromise = api(req).patch('/users/' + res.locals.currentPayload.userId, {
        json: userUpdate
    });

    if (req.body.Erhebung) {
        consentPromise = api(req).get('/consents/', {
            qs: {userId: res.locals.currentPayload.userId}
        }).then(consent => {
            consentUpdate.form = 'digital';
            consentUpdate.privacyConsent = req.body.Erhebung;
            consentUpdate.thirdPartyConsent = req.body.Pseudonymisierung;
            consentUpdate.termsOfUseConsent = req.body.Nutzungsbedingungen;
            consentUpdate.researchConsent = req.body.Forschung;
            return api(req).patch('/consents/' + consent.data[0]._id, {
                json: {userConsent: consentUpdate}
            });
        });
        
    }

    return Promise.all([accountPromise, userPromise, consentPromise])
            // Nutzerdatenmails vorerst nicht zuschicken. Passwort muss erst verschlüsselt werden.
        /*
        .then(async () => {
        if (req.body["sendCredentials"]){
            let mailcontent = {
                json: { email: res.locals.currentUser.email,
                        subject: `Deine Zugangsdaten für die ${res.locals.theme.title}!`,
                        headers: {},
                        content: {
                            "text": `Hallo ${res.locals.currentUser.displayName}

mit folgenden Anmeldedaten kannst du dich in der ${res.locals.theme.title} einloggen:

Adresse: ${req.headers.origin || process.env.HOST}
E-Mail: ${res.locals.currentUser.email}
Passwort: ${req.body["password-1"]}

Bitte bewahre die Zugangsdaten auf.

Viel Spaß wünscht dir dein 
${res.locals.theme.short_title}-Team`,
                            "html": ""
                        }
                }
            }

            try {
                await api(req).post('/mails/', mailcontent);
                res.status(200).json({type: 'success', message: `Die Zugangsdaten wurden erfolgreich an ${res.locals.currentUser.email} verschickt.`});    
            } catch (err) {
                // console.warn("Mailing fehlgeschlagen, zweiter Versuch");
                // console.error("ERR: " + err);
                try {
                    await api(req).post('/mails/', mailcontent);
                    res.status(200).json({type: 'success', message: `Die Zugangsdaten wurden erfolgreich an ${res.locals.currentUser.email} verschickt.`});
                } catch (err) {
                    res.status(200).json({type: 'danger', message: `Die Zugangsdaten konnten nicht an ${res.locals.currentUser.email}  verschickt werden. Bitte notiere dir dein Passwort selbst.`});
                }
            }
        }

    })*/
    .catch(err => {
        res.status(500).send((err.error || err).message || "Ein Fehler ist bei der Verarbeitung der FirstLogin Daten aufgetreten.");
    });
});
router.get('/existingU14', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingUserU14', {
        title: 'Willkommen - Erster Login für bestehende Nutzer',
        hideMenu: true
    });
});
router.get('/existingUE14', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingUserUE14', {
        title: 'Willkommen - Erster Login für bestehende Nutzer',
        hideMenu: true
    });
});
router.get('/existingGeb14', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingGeb14', {
        title: 'Willkommen - Erster Login',
        hideMenu: true
    });
});

module.exports = router;
