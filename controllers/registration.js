
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
 * Warnings for users who wan't to use the old register version if not teacher
 */

router.get(['/register', '/register/*'], function (req, res, next) {
    res.render('registration/deprecated_warning');
});

/*
 * Dataprivacy Routes
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
    return api(req).post('/registration/', {
        json: req.body,
		qs:{ 
			sso: req.params.sso,
            accountId: req.params.accountId
		}
    }).then(response => {   
        //send Mails
        let eMailAdresses = [response.user.email];
        if(response.parent){
            eMailAdresses.push(response.parent.email);
        }
        eMailAdresses.forEach(eMailAdress => {
            let passwordText = "";
            if (req.body["initial-password"]) {
                passwordText = `Startpasswort: ${req.body["initial-password"]}`;
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
Nach dem ersten Login musst du ein persönliches Passwort festlegen. Wenn du zwischen 14 und 18 Jahre alt bist, bestätige bitte zusätzlich die Einverständniserklärung, damit du die ${res.locals.theme.short_title} nutzen kannst.
Viel Spaß und einen guten Start wünscht dir dein
${res.locals.theme.short_title}-Team`
                        }
                }
            });
        });
    }).then(function() {
        if (req.params.sso) {
            res.cookie('jwt', req.cookies.jwt, {expires: new Date(Date.now() - 100000)});
        }
    }).then(function () {
        res.sendStatus(200);
    }).catch(err => {
        res.status(500).send((err.error||{}).message || err.message || "Fehler bei der Registrierung.");
    });
});

const formatBirthdate=(datestamp)=>{
	if( datestamp==undefined ) 
		return undefined;
	
	const d=datestamp.split('T')[0].split(/-/g);
	return d[2]+'.'+d[1]+'.'+d[0];
};

router.get(['/registration/:classOrSchoolId/byparent', '/registration/:classOrSchoolId/byparent/:sso/:accountId'], function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);
    
    res.render('registration/registration-parent', {
        title: 'Registrierung - Eltern',
        classOrSchoolId: req.params.classOrSchoolId,
        hideMenu: true,
        sso: req.params.sso==="sso",
		birthdate: formatBirthdate((req.query||{}).birthday),
		account:req.params.accountId,
        knownData: req.query
    });
});

router.get(['/registration/:classOrSchoolId/bystudent', '/registration/:classOrSchoolId/bystudent/:sso/:accountId'], function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);
    
    let knownData = req.query;
    knownData.classOrSchoolId = req.params.classOrSchoolId;
    knownData.birthdate = formatBirthdate((req.query||{}).birthday);
    knownData.sso = req.params.sso==="sso";
    knownData.account = req.params.accountId||"";

    
    res.render('registration/registration-student', {
        title: 'Registrierung - Schüler*',
        hideMenu: true,
        knownData
    });
});

router.get(['/registration/:classOrSchoolId/byemployee', '/registration/:classOrSchoolId/byteacher/:sso/:accountId'], function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);
    
    if (req.query.id) {
        return api(req).get('/users/linkImport/'+req.query.id).then(user => {
            res.render('registration/registration-employee', {
                title: 'Registrierung - Lehrer*/Admins*',
                classOrSchoolId: req.params.classOrSchoolId,
                hideMenu: true,
                account:req.params.accountId||"",
                user: user
            });
        });
    } else {
        res.render('registration/registration-employee', {
            title: 'Registrierung - Lehrer*/Admins*',
            classOrSchoolId: req.params.classOrSchoolId,
            hideMenu: true,
            sso: req.params.sso === "sso",
            birthdate: formatBirthdate((req.query || {}).birthday),
            account: req.params.accountId || ""
        });
    }
});

router.get(['/registration/:classOrSchoolId', '/registration/:classOrSchoolId/:sso/:accountId'], function (req, res, next) {
    if(!RegExp("^[0-9a-fA-F]{24}$").test(req.params.classOrSchoolId))
        if (req.params.sso && !RegExp("^[0-9a-fA-F]{24}$").test(req.params.accountId))
            return res.sendStatus(500);
    
    if (req.query.id) {
        return api(req).get('/users/linkImport/'+req.query.id).then(user => {
            res.render('registration/registration', {
                title: 'Herzlich Willkommen bei der Registrierung',
                classOrSchoolId: req.params.classOrSchoolId,
                hideMenu: true,
                account:req.params.accountId||"",
                user: user
            });
        });
    } else {
        res.render('registration/registration', {
            title: 'Herzlich Willkommen bei der Registrierung',
            classOrSchoolId: req.params.classOrSchoolId,
            hideMenu: true,
            sso: req.params.sso==="sso",
            account:req.params.accountId||""
        });
	}
});

module.exports = router;