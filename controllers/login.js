/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');



const getSelectOptions = (req, service, query) => {
    return api(req).get('/' + service, {
        qs: query
    }).then(data => {
        return data.data;
    });
};


// Login

router.post('/login/', function (req, res, next) {
    const username = req.body.username; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize
    const systemId = req.body.systemId;

    const login = (data) => {
        return api(req).post('/authentication', {json: data}).then(data => {
            res.cookie('jwt', data.accessToken);
            res.redirect('/login/success/');
        }).catch(_ => {
            res.locals.notification = {
                'type': 'danger',
                'message': 'Login fehlgeschlagen.'
            };
            next();
        });
    };

    if(systemId) {
        return api(req).get('/systems/' + req.body.systemId).then(system => {
            return login({strategy: system.type, username, password, systemId});
        });
    } else {
        return login({strategy: 'local', username, password});
    }
});


router.all('/login/', function (req, res, next) {
    authHelper.isAuthenticated(req).then(isAuthenticated => {
        if(isAuthenticated) {
            return res.redirect('/login/success/');
        } else {
            let schoolsPromise = getSelectOptions(req, 'schools');

            Promise.all([
                schoolsPromise
            ]).then(([schools, systems]) => {
                return res.render('authentication/login', {schools, systems: []});
            });
        }
    });
});

// so we can do proper redirecting and stuff :)
router.get('/login/success', authHelper.authChecker, function(req, res, next) {
    if(res.locals.currentUser) {
        res.redirect('/dashboard/');
    } else {
        // if this happens: SSO
        res.redirect('/register/user/' + res.locals.currentPayload.accountId);
    }
});

router.get('/login/systems/:schoolId', function (req, res, next) {
    return api(req).get('/schools/' + req.params.schoolId, {
        qs: {$populate: ['systems']}
    }).then(data => {
        return res.send(data.systems);
    });
});

router.get('/logout/', function (req, res, next) {
    api(req).del('/authentication')
        .then(_ => {
            res.clearCookie('jwt');
            return res.redirect('/login/');
        }).catch(_ => {
            return res.redirect('/login/');
        });
});

module.exports = router;
