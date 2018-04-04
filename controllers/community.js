const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');

router.get('/', function (req, res, next) {

    authHelper.isAuthenticated(req).then(isAuthenticated => {
        let template = isAuthenticated ? 'community/community_loggedin' : 'community/community_guest';
        if(isAuthenticated) {
            return authHelper.populateCurrentUser(req, res)
                .then(_ => authHelper.restrictSidebar(req, res))
                .then(_ => Promise.resolve(template));
        }
        return Promise.resolve(template);
    }).then( template =>
        res.render(template, {
            title: 'Mitmachen',
            inline: true
        })
    );
});

module.exports = router;
