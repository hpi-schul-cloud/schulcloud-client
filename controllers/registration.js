
const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

const createAccount = (req, {username, password, userId, activated}) => {
    return api(req).post('/accounts', {json: {
        username,
        password,
        userId,
        activated
    }});
};

/*
 * Old registration process if teacher created by teacher/admin until phase 2 of that project
 */
router.get('/register/account/:userId', function (req, res, next) {
    res.render('registration/oldregistration', {
        title: 'Zugangsdaten eintragen',
        subtitle: '',//'für ' + user.firstName + ' ' + user.lastName,
        action: '/register/account',
        userId: req.params.userId,
        buttonLabel: 'Registrieren',
        inline: true
    });
});

router.post('/register/account', function (req, res, next) {
    const username = req.body.email;
    const password = req.body.password;
    const userId = req.body.userId;
    
    createAccount(req, {
        username,
        password,
        userId,
        activated: true
    }).then(_ => {
        return res.redirect('/');
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
 * Warnings for users who wan't to use the old register version if not teacher
 */

router.get('/register', function (req, res, next) {
    res.render('registration/deprecated_warning');
});
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
    return api(req).post('/registration/', {
        json: req.body  
    }).then(response => {   
        //send Mails
        let eMailAdresses = [response.user.email];
        if(response.parent){
            eMailAdresses.push(response.parent.email);
        }
        eMailAdresses.forEach(eMailAdress => {
            return api(req).post('/mails/', {
                json: { email: eMailAdress,
                        subject: `Willkommen in der ${res.locals.theme.title}!`,
                        headers: {},
                        content: {
                            "text": `Hallo ${response.user.firstName}
mit folgenden Anmeldedaten kannst du dich in der ${res.locals.theme.title} einloggen:
Adresse: ${req.headers.origin || process.env.HOST}
E-Mail: ${response.user.email}
Startpasswort: ${req.body["initial-password"]}
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
        res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung.");
    });
});

router.get('/registration/:classOrSchoolId/byparent', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        return res.sendStatus(500);
    
    res.render('registration/registration-parent', {
        title: 'Registrierung - Eltern',
        classOrSchoolId: req.params.classOrSchoolId,
        hideMenu: true
    });
});
router.get('/registration/:classOrSchoolId/bystudent', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        return res.sendStatus(500);
    
    res.render('registration/registration-student', {
        title: 'Registrierung - Schüler*',
        classOrSchoolId: req.params.classOrSchoolId,
        hideMenu: true
    });
});

router.get('/registration/:classOrSchoolId', function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        return res.sendStatus(500);
    
    res.render('registration/registration', {
        title: 'Herzlich Willkommen bei der Registrierung',
        classOrSchoolId: req.params.classOrSchoolId,
        hideMenu: true
    });
});

module.exports = router;