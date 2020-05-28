const express = require('express');

const router = express.Router();
const authHelper = require('../helpers/authentication');

router.get('/', (req, res, next) => {
	authHelper.isAuthenticated(req).then((isAuthenticated) => {
		const template = isAuthenticated ? 'security/security_loggedin' : 'security/security_guests';
		if (isAuthenticated) {
			return authHelper.populateCurrentUser(req, res)
				.then(() => authHelper.restrictSidebar(req, res))
				.then(() => Promise.resolve(template));
		}
		return Promise.resolve(template);
	}).then(template => res.render(template,{
		inline: !!template.includes('guest')}));
});

module.exports = router;
