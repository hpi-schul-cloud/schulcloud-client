const express = require('express');

const router = express.Router();
const authHelper = require('../helpers/authentication');

// Team
const team = require('../helpers/content/team.js');

router.get('/', (req, res, next) => {
	const teamLength = team.reduce((accumulator, section) => accumulator + section.team.length, 0);

	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		const template = isAuthenticated ? 'team/team_loggedin' : 'team/team_guest';
		if (isAuthenticated) {
			return authHelper.populateCurrentUser(req, res)
				.then((_) => authHelper.restrictSidebar(req, res))
				.then((_) => Promise.resolve(template));
		}
		return Promise.resolve(template);
	}).then((template) => res.render(template, {
		titlePage: res.$t('team.headline.team'),
		inline: !!template.includes('guest'),
		teams: team,
		teamLength,
	}));
});

module.exports = router;
