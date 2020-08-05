const express = require('express');

const router = express.Router();
const { orderBy } = require('lodash');
const authHelper = require('../helpers/authentication');

// Partners
const partners = require('../helpers/partner/partners.json');

// Sort Content-Partners, Sponsors & Advisers by Name
partners.content_partners = orderBy(partners.content_partners,
	[x => x.name.toLowerCase()], ['asc']);
partners.sponsors = orderBy(partners.sponsors,
	[x => x.name.toLowerCase()], ['asc']);
partners.advisers = orderBy(partners.advisers,
	[x => x.name.toLowerCase()], ['asc']);

const hiddenAdvisers = partners.advisers.splice(4);
const hiddenContentPartners = partners.content_partners.splice(4);

router.get('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		const template = isAuthenticated ? 'partner/partner_loggedin' : 'partner/partner_guests';
		if (isAuthenticated) {
			return authHelper.populateCurrentUser(req, res)
				.then(() => authHelper.restrictSidebar(req, res))
				.then(() => Promise.resolve(template));
		}
		return Promise.resolve(template);
	}).then(template => res.render(template, {
		title: res.$t('global.link.partner'),
		inline: !!template.includes('guest'),
		partners,
		hiddenAdvisers,
		hiddenContentPartners,
	}));
});

module.exports = router;
