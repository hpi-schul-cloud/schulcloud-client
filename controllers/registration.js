
const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');


const login = (req, res, options) => {
    return api({}).post('/authentication', {json: options}).then(data => {
        return res.cookie('jwt', data.accessToken);
    });
};

const createUser = (req, {firstName, lastName, email, roles = ['student'], schoolId}) => {
    return api(req).post('/users', {json: {
        firstName,
        lastName,
        email,
        roles,
        schoolId
    }});
};

const createAccount = (req, {username, password, userId}) => {
    return api(req).post('/accounts', {json: {
        username,
        password,
        userId
    }});
};

/*
 * Case: A user (teacher/admin) got created via admin, but no account so we need to create one
 * Result: existing User, new Account => done
 */

router.get('/register/account/:userId', function (req, res, next) {
    api(req).get('/users/' + req.params.userId).then(user => {
        res.render('registration/account', {
            title: 'Zugangsdaten eintragen',
            subtitle: 'für ' + user.firstName + ' ' + user.lastName,
            action: '/register/account',
            userId: req.params.userId,
            buttonLabel: 'Abschließen'
        });
    });
});


router.post('/register/account', function (req, res, next) {
    const username = req.body.email; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize
    const userId = req.body.userId; // TODO: sanitize

    createAccount(req, {
        username,
        password,
        userId
    }).then(account => {
        return login(req, res, {strategy:'local', username, password});
    }).then(_ => {
        return res.redirect('/login/success/');
    }).catch(err => {
        return res.status(500).send(err);
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
            buttonLabel: 'Abschließen'
        });
    });
});


router.post('/register/user', authHelper.authChecker, function (req, res, next) {
    // TODO: sanitize
    createUser(req, req.body).then(user => {
        // update account with userId
        return api(req).patch('/accounts/' + req.body.accountId, {json: {
            userId: user._id
        }});
    }).then(_ => {
        // refresh AccessToken
        return login(req, res, {strategy:'jwt', accessToken: req.cookies.jwt});
    }).then(_ => {
        return res.redirect('/login/success/');
    }).catch(err => {
        return res.status(500).send(err);
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
            buttonLabel: 'Registrieren'
        });
    });
});


router.post('/register/', function (req, res, next) {
    const username = req.body.email; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize

    createUser(req, req.body)
        .then(user => {
            return createAccount(req, {username, password, userId: user._id});
        })
        .then(_ => {
            // do login at this point already so we don't need to fuck around with passwords
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


module.exports = router;
