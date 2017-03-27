const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

// secure routes
router.use(authHelper.authChecker);

router.post('/', function (req, res, next) {
    const {firstName, lastName, email} = req.body; // TODO: sanitize

    return api(req).patch('/users/' + res.locals.currentUser._id, {json: {
        firstName,
        lastName,
        email
    }}).then(authHelper.populateCurrentUser.bind(this, req, res)).then(_ => {
        res.redirect('/account/');
    });
});

router.get('/', function (req, res, next) {
    res.render('account/settings', {title: 'Dein Account'});
});

module.exports = router;
