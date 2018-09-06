const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');

// Schools
const schools = require('../helpers/content/schools.json');

router.get('/', function (req, res, next) {

    authHelper.isAuthenticated(req).then(isAuthenticated => {
        let template = isAuthenticated ? 'about/about_loggedin' : 'about/about_guest';
        if(isAuthenticated) {
            return authHelper.populateCurrentUser(req, res)
                .then(_ => authHelper.restrictSidebar(req, res))
                .then(_ => Promise.resolve(template));
        }
        return Promise.resolve(template);
    }).then( template =>
        res.render(template, {
            title: 'Projekt',
            inline: !!template.includes('guest'),
            schools
        })
    );
});

module.exports = router;
