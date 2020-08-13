const express = require('express');
const authHelper = require('../helpers/authentication');

const router = express.Router();

router.get('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		const template = isAuthenticated ? 'imprint/imprint_logged_in' : 'imprint/imprint_guests';
		if (isAuthenticated) {
			return authHelper.populateCurrentUser(req, res)
				.then(() => authHelper.restrictSidebar(req, res))
				.then(() => Promise.resolve(template));
		}
		return Promise.resolve(template, isAuthenticated);
	}).then((template, isAuthenticated) => {
		res.render(template, {
			title: res.$t('global.link.imprint'),
			inline: isAuthenticated,
		});
	});
});

module.exports = router;
