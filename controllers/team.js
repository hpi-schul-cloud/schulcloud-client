const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const timesHelper = require('../helpers/timesHelper');

// Team
const team = require('../helpers/content/team.js');

router.get('/', function (req, res, next) {
    let teamLength = team.reduce((accumulator, section) => {return accumulator + section.team.length;}, 0);
	const timezone = timesHelper.getChangedTimezoneString();

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
			titlePage: res.$t('team.headline.team'),
            inline: !!template.includes('guest'),
            teams: team,
			timezone,
            teamLength
        })
    );
});

module.exports = router;
