
const express = require('express');
const router = express.Router();
const api = require('../api');
const { cookieDomain } = require('../helpers/authentication');

/*
 * Warnings for users who wan't to use the old register version if not teacher
 */
router.get(['/register', '/register/*'], function (req, res, next) {
    res.render('registration/deprecated_warning');
});

/*
 * EzD Dataprivacy Routes
 */
router.post('/registration/pincreation', function (req, res, next) {
    if (req.body && req.body.email) {
        return api(req).post('/registrationPins/', {
            json: { email: req.body.email, byRole: req.body.byRole }
        }).then(() => {
            res.sendStatus(200);
        }).catch(err => res.status(500).send(err));
    } else {
        res.sendStatus(500);
    }
});

router.post(['/registration/submit', '/registration/submit/:sso/:accountId'], function (req, res, next) {
    // normalize form data
    req.body.privacyConsent = req.body.privacyConsent === "true";
    req.body.researchConsent = req.body.researchConsent === "true";
    req.body.thirdPartyConsent = req.body.thirdPartyConsent === "true";
    req.body.termsOfUseConsent = req.body.termsOfUseConsent === "true";
    req.body.roles = Array.isArray(req.body.roles) ? req.body.roles : [req.body.roles];

    return api(req).post('/registration/', {
        json: req.body
    }).then(response => {   
        //send Mails
        let eMailAdresses = [response.user.email];
        if(response.parent){
            eMailAdresses.push(response.parent.email);
        }
        eMailAdresses.forEach(eMailAdress => {
            let passwordText = "";
            if (req.body.roles.includes("student")) {
                passwordText = `Startpasswort: ${req.body["password_1"]}`;
            }
            return api(req).post('/mails/', {
                json: { email: eMailAdress,
                        subject: `Willkommen in der ${res.locals.theme.title}!`,
                        headers: {},
                        content: {
                            "text": `Hallo ${response.user.firstName}
mit folgenden Anmeldedaten kannst du dich in der ${res.locals.theme.title} einloggen:
Adresse: ${req.headers.origin || process.env.HOST}
E-Mail: ${response.user.email}
${passwordText}
Für Schüler: Nach dem ersten Login musst du ein persönliches Passwort festlegen. Wenn du zwischen 14 und 18 Jahre alt bist, bestätige bitte zusätzlich die Einverständniserklärung, damit du die ${res.locals.theme.short_title} nutzen kannst.
Viel Spaß und einen guten Start wünscht dir dein
${res.locals.theme.short_title}-Team`
                        }
                }
            });
        });
    }).then(function() {
        if (req.params.sso) {
            res.cookie('jwt', req.cookies.jwt,
                Object.assign({},
                    { expires: new Date(Date.now() - 100000) },
                    cookieDomain(res)
                ));
        }
    }).then(function () {
        res.sendStatus(200);
    }).catch(err => {
        res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung.");
    });
});

router.get(['/registration/:classOrSchoolId/byparent', '/registration/:classOrSchoolId/byparent/:sso/:accountId'], async function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);
    
    let user = {};
    user.importHash = req.query.importHash;
    user.classOrSchoolId = req.params.classOrSchoolId;
    user.sso = req.params.sso==="sso";
    user.account = req.params.accountId||"";

    if (user.importHash) {
        let existingUser = await api(req).get('/users/linkImport/'+user.importHash);
        Object.assign(user, existingUser);
    }
    res.render('registration/registration-parent', {
        title: 'Registrierung - Eltern',
        hideMenu: true,
        user
    });
});

router.get(['/registration/:classOrSchoolId/bystudent', '/registration/:classOrSchoolId/bystudent/:sso/:accountId'], async function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);

    let user = {};
    user.importHash = req.query.importHash;
    user.classOrSchoolId = req.params.classOrSchoolId;
    user.sso = req.params.sso==="sso";
    user.account = req.params.accountId||"";

    if (user.importHash) {
        let existingUser = await api(req).get('/users/linkImport/'+user.importHash);
        Object.assign(user, existingUser);
    }

    res.render('registration/registration-student', {
        title: 'Registrierung - Schüler*',
        hideMenu: true,
        user
    });
});

router.get(['/registration/:classOrSchoolId/byemployee', '/registration/:classOrSchoolId/byteacher/:sso/:accountId'], async function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(400);
    
    let user = {};
    user.importHash = req.query.importHash || req.query.id; // req.query.id is deprecated
    user.classOrSchoolId = req.params.classOrSchoolId;
    user.sso = req.params.sso==="sso";
    user.account = req.params.accountId||"";

    if (user.importHash) {
        let existingUser = await api(req).get('/users/linkImport/'+user.importHash);
        Object.assign(user, existingUser);
    }

    res.render('registration/registration-employee', {
        title: 'Registrierung - Lehrer*/Admins*',
        hideMenu: true,
        user
    });
});

router.get(['/registration/:classOrSchoolId', '/registration/:classOrSchoolId/:sso/:accountId'], function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);
    
    res.render('registration/registration', {
        title: 'Herzlich Willkommen bei der Registrierung',
        hideMenu: true,
        importHash: req.query.importHash || req.query.id, // req.query.id is deprecated
        classOrSchoolId: req.params.classOrSchoolId,
        sso: req.params.sso==="sso",
        account:req.params.accountId||"",
    });
});

module.exports = router;