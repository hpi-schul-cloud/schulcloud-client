const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    res.render('firstLogin/firstLogin', {
        title: 'Willkommen - Erster Login'
    });
});
router.get('/14_17', function (req, res, next) {
    res.render('firstLogin/firstLogin14_17', {
        title: 'Willkommen - Erster Login (14 bis 17 Jahre)'
    });
});
router.get('/U14', function (req, res, next) {
    res.render('firstLogin/firstLoginU14', {
        title: 'Willkommen - Erster Login'
    });
});
router.get('/UE18', function (req, res, next) {
    res.render('firstLogin/firstLoginUE18', {
        title: 'Willkommen - Erster Login'
    });
});
router.get('/existing', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingUser', {
        title: 'Willkommen - Erster Login für bestehende Nutzer'
    });
});
router.post('/submit', function (req, res, next) {
    let accountId = res.locals.currentPayload.accountId
    let accountUpdate = {};
    let userUpdate = {};
    let consentUpdate = {};

    if (req.body["password-1"]) {
        accountUpdate.password_verification = req.body.password_verification;
        accountUpdate.password = req.body["password-1"];
    }

    let accountPromise = api(req).patch('/accounts/' + accountId, {
        json: accountUpdate
    });
    let userPromise = Promise.resolve();
    let consentPromise = Promise.resolve();

    return Promise.all([accountPromise, userPromise, consentPromise]).then(() => {

        if (req.body["sendCredentials"]){
            return api(req).post('/mails/', {
                json: { email: res.locals.currentUser.email,
                        subject: "Willkommen in der HPI Schul-Cloud!",
                        headers: {},
                        content: { // TODO: use js template strings instead of concat (``)
                            "text": "Hallo " + res.locals.currentUser.displayName + "\n" +
                                    "lorem ipsum \n" +
                                    "bla" + req.body["password-1"] + "\n" +
                                    /* TODO: Email Text und was da rein muss sonst so*/
                                    "Viel Spaß und einen guten Start wünscht dir dein \n" +
                                    "Schul-Cloud-Team",
                            "html": ""
                        }
                }
            });
        } 

        res.sendStatus(200);
    }).catch(err => {
        res.status(500).send(err)
    });
});
/*
    return api(req).patch('/users/0000d231816abba584714c9e', {
        json: {birthday: new Date(req.body.studentBirthdate)}
    }).then(user => {
        return api(req).get('/consents/', {
            qs: {userId: user._id}
        });
    }).then(consent => {
        let userConsent = {
            form: 'digital',
            privacyConsent: req.body.Erhebung,
            thirdPartyConsent: req.body.Pseudonymisierung,
            termsOfUseConsent: Boolean(req.body.Nutzungsbedingungen),
            researchConsent: req.body.Forschung
        };
        return api(req).patch('/consents/' + consent.data[0]._id, {
            json: {userConsent: userConsent}
        });
    }).then(consent => {
        res.sendStatus(200);
    }).catch(err => res.status(500).send(err));
});*/
router.get('/existingU14', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingUserU14', {
        title: 'Willkommen - Erster Login für bestehende Nutzer'
    });
});
router.get('/existingUE14', function (req, res, next) {
    res.render('firstLogin/firstLoginExistingUserUE14', {
        title: 'Willkommen - Erster Login für bestehende Nutzer'
    });
});

module.exports = router;
