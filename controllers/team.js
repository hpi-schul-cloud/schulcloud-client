const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');

// Team
const team = require('../helpers/content/team.json');

router.get('/', function (req, res, next) {
    let teamLength = team.below.team.length + team.end.team.length + team.high.team.length + team.low.team.length + team.medium.team.length;

    authHelper.isAuthenticated(req).then(isAuthenticated => {
        let template = isAuthenticated ? 'team/team_loggedin' : 'team/team_guest';
        if(isAuthenticated) {
            return authHelper.populateCurrentUser(req, res)
                .then(_ => authHelper.restrictSidebar(req, res))
                .then(_ => Promise.resolve(template));
        }
        return Promise.resolve(template);
    }).then( template =>
        res.render(template, {
            title: 'Das HPI Schul-Cloud Team',
            inline: !!template.includes('guest'),
            teams: team,
            teamLength
        })
    );
});

module.exports = router;
