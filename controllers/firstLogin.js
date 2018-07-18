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
router.post('/existing/submit', function (req, res, next) {
    api(req).patch('/users/0000d231816abba584714c9e', {
        json: {birthday: new Date(req.body.studentBirthdate)}
    }).then(user => {
        res.sendStatus(200);
    }).catch(err => res.status(500).send(err));
});
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
