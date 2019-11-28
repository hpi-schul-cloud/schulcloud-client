const express = require('express');

const router = express.Router();
const authHelper = require('../helpers/authentication');
// Schools
const schools = require('../helpers/content/schools.json');

const hiddenBPSchools = schools.bp.splice(4);
const hiddenSchoolsMarch2017 = schools.march2017.splice(4);
const hiddenSchoolsMay2018 = schools.may2018.splice(4);
const hiddenSchoolsFeb2019 = schools.feb2019.splice(4);
const hiddenSchoolsThuringia2019 = schools.thuringia2019.splice(4);

router.get('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		const template = isAuthenticated ? 'about/about_loggedin' : 'about/about_guest';
		if (isAuthenticated) {
			return authHelper.populateCurrentUser(req, res)
				.then(_ => authHelper.restrictSidebar(req, res))
				.then(_ => Promise.resolve(template));
		}
		return Promise.resolve(template);
	}).then(template => res.render(template, {
		title: 'Projekt',
		inline: !!template.includes('guest'),
		schools,
		hiddenBPSchools,
		hiddenSchoolsMarch2017,
		hiddenSchoolsMay2018,
		hiddenSchoolsFeb2019,
		hiddenSchoolsThuringia2019,
	}));
});

module.exports = router;
