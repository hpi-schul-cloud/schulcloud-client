const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

router.get('/', function (req, res, next) {
    authHelper.isAuthenticated(req).then(isAuthenticated => {
        let template = isAuthenticated ? 'imprint/imprint_logged_in' : 'imprint/imprint_guests';
        if(isAuthenticated) {
            return authHelper.populateCurrentUser(req, res)
                .then(_ => authHelper.restrictSidebar(req, res))
                .then(_ => Promise.resolve(template));
        }
        return Promise.resolve(template);
    }).then(template => {
            res.render(template, {
                title: 'Impressum',
                inline: !!template.includes('guest')
            });
    });
});

module.exports = router;