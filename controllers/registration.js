
const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');


const login = (req, res, options) => {
    return api({}).post('/authentication', {json: options}).then(data => {
        return res.cookie('jwt', data.accessToken);
    });
};

const createUser = (req, {firstName, lastName, email, roles = ['student'], schoolId, gender}) => {
    (gender === '' || !gender) ? gender = null : "";
    return api(req).post('/users', {json: {
        firstName,
        lastName,
        email,
        roles,
        schoolId,
        gender
    }});
};

const createAccount = (req, {username, password, userId, activated}) => {
    return api(req).post('/accounts', {json: {
        username,
        password,
        userId,
        activated
    }});
};

/*
 * Case: A user (teacher/admin) got created via admin, but no account so we need to create one
 * Result: existing User, new Account => done
 */

router.get('/register/account/:userId', function (req, res, next) {
        res.render('registration/account', {
            title: 'Zugangsdaten eintragen',
            subtitle: '',//'für ' + user.firstName + ' ' + user.lastName,
            action: '/register/account',
            userId: req.params.userId,
            buttonLabel: 'Abschließen',
            inline: true
        });
});


router.post('/register/account', function (req, res, next) {
    const username = req.body.email; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize
    const userId = req.body.userId; // TODO: sanitize

    createAccount(req, {
        username,
        password,
        userId,
        activated: true
    }).then(account => {
        return login(req, res, {strategy:'local', username, password});
    }).then(_ => {
        return res.redirect('/login/success/');
    }).catch(err => {
        req.session.notification = {
            type: 'danger',
            message: err.error.message || err.message
        };
        const referrer = req.get('Referrer');
        res.redirect(referrer);
    });
});


/*
 * Case: A account exists (regular register or SSO), but no user so we need to create one, and account already loggedin
 * Result: new User, existing Account => done
 */

router.get('/register/user/:accountId', authHelper.authChecker, function (req, res, next) {
    let account;
    api(req).get('/accounts/' + req.params.accountId).then(data => {
        account = data;
        return api(req).get('/schools/', {
            qs: {
                systems: account.systemId
            }
        });
    }).then(schools => {
        schools = schools.data;
        const school = schools[0];
        res.render('registration/user', {
            title: 'Nutzerdaten eintragen',
            subtitle: 'für ' + account.username,
            action: '/register/user/',
            accountId: req.params.accountId,
            schoolId: school._id,
            buttonLabel: 'Abschließen',
            inline: true
        });
    });
});


router.post('/register/user', authHelper.authChecker, function (req, res, next) {
    // TODO: sanitize
    createUser(req, req.body).then(user => {
        // update account with userId
        return api(req).patch('/accounts/' + req.body.accountId, {json: {
            userId: user._id,
            activated: true
        }});
    }).then(_ => {
        // refresh AccessToken
        return login(req, res, {strategy:'jwt', accessToken: req.cookies.jwt});
    }).then(_ => {
        return res.redirect('/login/success/');
    }).catch(err => {
        req.session.notification = {
            type: 'danger',
            message: err.error.message || err.message
        };
        const referrer = req.get('Referrer');
        res.redirect(referrer);
    });
});


/*
 * Case: A student needs to signup without SSO
 * Result: new User, new Account => login
 */

router.get('/register/:schoolId', function (req, res, next) {
    api(req).get('/schools/' + req.params.schoolId).then(school => {
        res.render('registration/full', {
            title: 'Registrieren',
            subtitle: school.name,
            action: '/register/',
            schoolId: req.params.schoolId,
            buttonLabel: 'Registrieren',
            inline: true
        });
    });
});


router.post('/register/', function (req, res, next) {
    const username = req.body.email; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize
    const name = req.body.firstName + " " + req.body.lastName;

    createUser(req, req.body)
        .then(user => {
            return createAccount(req, {username, password, userId: user._id})
                .then(account => {
                    api(req).post('/mails', {json: {email: username, subject: "Registrierung in der Schul-Cloud", content: {text:
                        "Sehr geehrte/r " + name + ",\n\nBitte bestätigen Sie uns noch Ihre E-Mail Adresse unter folgendem Link:\n" + (req.headers.origin || process.env.HOST) + "/register/confirm/" + account._id + "\n\nMit freundlichen Grüßen,\nIhr Schul-Cloud Team"}}});
                });
        }).then(_ => {
            return res.render('registration/confirmation', {
                title: 'Vielen Dank für das Registrieren in der Schul-Cloud,\nbitte bestätigen Sie noch Ihre E-Mail Adresse',
                subtitle: 'Sie werden in 10 Sekunden auf die Anmeldeseite weitergeleitet, oder ',
                origin: "../../login",
                time: 10000,
                inline: true
            });
        }).catch(err => {
            req.session.notification = {
                type: 'danger',
                message: err.error.message || err.message
            };
            const referrer = req.get('Referrer');
                res.redirect(referrer);
            });
});

/**
 * Registration confirmation
 */

router.get('/register/confirm/:accountId', function (req, res, next) {
    let account;
    api(req).get('/accounts/' + req.params.accountId).then(data => {
        account = data;
        api(req).post('/accounts/confirm/', {json: {accountId: req.params.accountId}})
            .then(_ => {
                res.render('registration/confirmation', {
                    title: 'Vielen Dank für das Bestätigen der Anmeldung',
                    subtitle: 'Sie werden in 5 Sekunden auf die Anmeldeseite weitergeleitet, oder ',
                    origin: "../../login",
                    time: 5000,
                    inline: true
                });
            });
    }).catch(_ => {
        res.redirect('/login');
    });
});

/**
 * New Dataprivacy Routes
 */
router.get('/registration/pinvalidation', function (req, res, next) {
    if (req.query && req.query.email && req.query.pin) {
        return api(req).get('/registrationPins/', {
            qs: {
                $and: [{"pin": req.query.pin, "email": req.query.email} ]
            }
        }).then(check => {
            if (check.data && check.data.length>0)
                res.send("verified");
            else
                res.send("wrong");
        }).catch(err => res.status(500).send(err));
    } else {
        res.sendStatus(500);
    }
});
router.post('/registration/pinvalidation', function (req, res, next) {
    if (req.body && req.body.email) {
        return api(req).post('/registrationPins/', {
            json: { email: req.body.email, byParent: req.body.byParent }
        }).then(pin => {
            res.send((pin||{}).pin);
        }).catch(err => res.status(500).send(err));
    } else {
        res.sendStatus(500);
    }
});
/* versuch: nur 1 route für registration submits für eltern und ü18
router.post('/dataprivacy/registration/byparent/submit', function (req, res, next) {
    let user = {
        firstName: req.body["student-firstname"],
        lastName: req.body["student-secondname"],
        email: req.body["student-email"],
        schoolId: "0000d186816abba584714c5f", // get schoolid and courseGroup ID from link
        roles: ["0000d186816abba584714c99"] // role=student
    };

    return api(req).post('/users/', {
        json: user
    }).then(newUser => {
        return api(req).post('/consents/', {
            json: {userId: newUser._id}
        }).then(_ => {
            //if (Daten per Mail zuschicken)
            //  sendEmail(Katrin)(newUser, req);
            res.sendStatus(200);
        }).catch(err => res.status(500).send(err));
    }).catch(err => res.status(500).send(err));
});
*/
router.post('/registration/submit', function (req, res, next) {

    let pininput = req.body["email-pin"]; 
    let usermail = req.body["parent-email"] ? req.body["parent-email"] : req.body["student-email"];
    let parent = null;
    let user;

    let passwort = req.body["initial-password"];

    return api(req).get('/registrationPins/', {
        qs: { "pin": pininput, "email": usermail }
    }).then(check => {
        //check pin
        if (!(check.data && check.data.length>0 && check.data[0].pin === pininput)) {
            res.status(500).send("Ungültige Pin, bitte überprüfe die Eingabe.");
        }
        if (req.body["parent-email"] && req.body["parent-email"] === req.body["student-email"]) {
            res.status(500).send("Bitte gib eine eigene E-Mail Adresse für dein Kind an.");
        }
        return Promise.resolve;
    }).then(function() {
        //create user
        user = {
            firstName: req.body["student-firstname"],
            lastName: req.body["student-secondname"],
            email: req.body["student-email"],
            gender: req.body["gender"],
            roles: ["student"],
            classId: req.body.classId,
            birthday: new Date(req.body["student-birthdate"])
        };
        return api(req).post('/users/', {
            json: user
        }).catch(err => res.status(500).send("Fehler beim Erstellen des Schülers. Eventuell ist die E-Mail-Adresse bereits im System registriert.")); // TODO: Errorhandling /account/ is used even when error occurs
    }).then(newUser => {
        user = newUser;
        // create account
        return createAccount(req, {username: user.email, password: passwort, userId: user._id, activated: true});
    }).then(res => {
        //add parent if necessary    
        if(req.body["parent-email"]) {
            parent = {
                firstName: req.body["parent-firstname"],
                lastName: req.body["parent-secondname"],
                email: req.body["parent-email"],
                children: [user._id],
                schoolId: user.schoolId,
                roles: ["parent"]
            };
            return api(req).post('/users/', {
                json: parent
            }).then(newParent => {
                parent = newParent;
                return api(req).patch('/users/' + user._id, {
                    json: {parents: [parent._id]}
                });
            }).catch(err => {
                if (err.error.message==="parentCreatePatch") {
                    next();
                } else {
                    res.status(500).send("Fehler beim Erstellen des Elternaccounts. Eventuell ist die E-Mail-Adresse bereits im System registriert."); // TODO: Errorhandling /account/ is used even when error occurs
                }
            });
        } else {
            return Promise.resolve;
        }
    }).then(function(){
        console.log("CONSENT");
        //store consent
        let consent = {
            form: 'digital',
            privacyConsent: req.body.Erhebung,
            thirdPartyConsent: req.body.Pseudonymisierung,
            termsOfUseConsent: Boolean(req.body.Nutzungsbedingungen),
            researchConsent: req.body.Forschung
        };
        if (parent) {
            consent.parentId = parent._id;
            return api(req).post('/consents/', {
                json: {
                    userId: user._id,
                    parentConsents: [consent]
                }
            });
        } else {
            return api(req).post('/consents/', {
                json: {userId: user._id, userConsent: consent}
            });
        }
    }).then(function() {
        //send Mails
        let eMailAdresses = [user.email];
        if(parent){
            eMailAdresses.push(parent.email);
        }
        eMailAdresses.forEach(eMailAdress => {
            return api(req).post('/mails/', {
                json: { email: eMailAdress,
                        subject: "Willkommen in der HPI Schul-Cloud!",
                        headers: {},
                        content: {
                            "text": `Hallo ${user.firstName}
\nmit folgenden Anmeldedaten kannst du dich in der HPI Schul-Cloud einloggen:
Adresse: ${req.headers.origin || process.env.HOST}
E-Mail: ${user.email}
Startpasswort: ${passwort}
\nNach dem ersten Login musst du ein persönliches Passwort festlegen. Wenn du zwischen 14 und 18 Jahre alt bist, bestätige bitte zusätzlich die Einverständniserklärung, damit du die Schul-Cloud nutzen kannst.
\nViel Spaß und einen guten Start wünscht dir dein
Schul-Cloud-Team`
                        }
                }
            });
        });
    }).then(function () {
        res.sendStatus(200);
    }).catch(err => {
        res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung."); // TODO: Errorhandling /account/ is used even when error occurs
    });
});

router.get('/registration/:classId/byparent', function (req, res, next) {
    res.render('registration/registration-parent', {
        title: 'Registrierung - Eltern',
        classId: req.params.classId,
        hideMenu: true
    });
});
router.get('/registration/:classId/bystudent', function (req, res, next) {
    res.render('registration/registration-student', {
        title: 'Registrierung - Schüler*',
        classId: req.params.classId,
        hideMenu: true
    });
});
router.get('/registration/:classId', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classId))
        return res.sendStatus(500);
    
    res.render('registration/registration', {
        title: 'Herzlich Willkommen bei der Registrierung',
        classId: req.params.classId,
        hideMenu: true
    });
});

module.exports = router;