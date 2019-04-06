const express = require('express');

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

// Schools
const schools = require('../helpers/content/schools.json');

const hiddenBPSchools = schools.bp.splice(4);
const hiddenSchoolsMarch2017 = schools.march2017.splice(4);
const hiddenSchoolsMai2018 = schools.mai2018.splice(4);

router.get('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		const template = isAuthenticated ? 'about/about_loggedin' : 'about/about_guest';
		if (isAuthenticated) {
			return authHelper.populateCurrentUser(req, res)
				.then(() => authHelper.restrictSidebar(req, res))
				.then(() => Promise.resolve(template));
		}
		return Promise.resolve(template);
	}).then(template => res.render(template, {
		title: 'Projekt',
		inline: !!template.includes('guest'),
		schools,
		hiddenBPSchools,
		hiddenSchoolsMarch2017,
		hiddenSchoolsMai2018,
	}));
});

router.get('/timeline.json', (req, res, next) => {
	api(req).get('/timelines/', {
		qs: {
			title: 'about',
		},
	}).then((timelineData) => {
		res.json(JSON.parse(timelineData.data[0].json));
	}).catch(err => next(err));
});

module.exports = router;
