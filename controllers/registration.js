
const express = require('express');
const router = express.Router();
const api = require('../api');

const createAccount = (req, {username, password, userId, activated}) => {
    return api(req).post('/accounts', {json: {
        username,
        password,
        userId,
        activated
    }});
};

/*
 * Warnings for users who wan't to use the old register version
 */

router.get('/register/*', function (req, res, next) {
    res.render('registration/deprecated_warning');
});

/*
 * Dataprivacy Routes
 */
router.post('/registration/pincreation', function (req, res, next) {
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

router.post('/registration/submit', function (req, res, next) {

    let pininput = req.body["email-pin"]; 
    let usermail = req.body["parent-email"] ? req.body["parent-email"] : req.body["student-email"];
    let parent = null;
    let user;

    let passwort = req.body["initial-password"];
    return api(req).get('/registrationPins/', {
        qs: { "pin": pininput, "email": usermail, verified:false }
    }).then(check => {
        //check pin
        if (!(check.data && check.data.length>0 && check.data[0].pin === pininput)) {
            return Promise.reject("Ungültige Pin, bitte überprüfe die Eingabe.");
        }
        if (req.body["parent-email"] && req.body["parent-email"] === req.body["student-email"]) {
            return Promise.reject("Bitte gib eine eigene E-Mail Adresse für dein Kind an.");
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
            json: user,
			qs:{email:req.body["parent-email"]}
        }).catch(err =>{
            return Promise.reject("Fehler beim Erstellen des Schülers. Eventuell ist die E-Mail-Adresse bereits im System registriert.");
        });
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
            }).catch(err => {
                if (err.error.message==="parentCreatePatch") {
                    return Promise.resolve();
                } else {
                    return Promise.reject(new Error("Fehler beim Erstellen des Elternaccounts."));
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
                        subject: `Willkommen in der ${res.locals.theme.title}!`,
                        headers: {},
                        content: {
                            "text": `Hallo ${user.firstName}

mit folgenden Anmeldedaten kannst du dich in der ${res.locals.theme.title} einloggen:
Adresse: ${req.headers.origin || process.env.HOST}
E-Mail: ${user.email}
Startpasswort: ${passwort}

Nach dem ersten Login musst du ein persönliches Passwort festlegen. Wenn du zwischen 14 und 18 Jahre alt bist, bestätige bitte zusätzlich die Einverständniserklärung, damit du die ${res.locals.theme.short_title} nutzen kannst.

Viel Spaß und einen guten Start wünscht dir dein
${res.locals.theme.short_title}-Team`
                        }
                }
            });
        });
    }).then(function () {
        res.sendStatus(200);
    }).catch(err => {

        /*
        //If user for student created, remove that user, cannot do this bc no rights to do this
        let userpromise = api(req).get('/users/', {
            qs: {email: req.body["student-email"]}
        }).then(students => {
            return api(req).delete('/users/' + students._id);
        });

        //If account for student created, remove that account, cannot do this bc no rights to do this
        let accpromise = api(req).get('/accounts/', {
            qs: {email: req.body["student-email"]}
        }).then(students => {
            return api(req).delete('/accounts/' + students._id);
        });

        Promise.all([userpromise, accpromise]).then(()=>{*/
            res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung."); // TODO: Errorhandling /account/ is used even when error occurs
        /*}).catch(err => {
            res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung.");
        });*/
    });
});

router.get('/registration/:classOrSchoolId/byparent', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        return res.sendStatus(500);
    
    res.render('registration/registration-parent', {
        title: 'Registrierung - Eltern',
        classId: req.params.classOrSchoolId,
        hideMenu: true
    });
});
router.get('/registration/:classOrSchoolId/bystudent', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        return res.sendStatus(500);
    
    res.render('registration/registration-student', {
        title: 'Registrierung - Schüler*',
        classId: req.params.classOrSchoolId,
        hideMenu: true
    });
});

router.get('/registration/:classOrSchoolId', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        return res.sendStatus(500);
    
    res.render('registration/registration', {
        title: 'Herzlich Willkommen bei der Registrierung',
        classId: req.params.classOrSchoolId,
        hideMenu: true
    });
});

module.exports = router;