const express = require('express');
const { URL } = require('url');
const authHelper = require('../helpers/authentication');
const { DOCUMENT_BASE_DIR, SC_THEME } = require('../config/global');
const { specificFiles: sf } = require('../config/documents');

const router = express.Router();

const createRedirectionLink = () => {
	const themeLinkPart = `/schul-cloud-hpi/${SC_THEME}/${SC_THEME === 'open' ? sf.privacy : sf.privacyExemplary}`;
	return new URL(themeLinkPart, DOCUMENT_BASE_DIR);
};

router.get('/', (req, res, next) => {
	if (SC_THEME === 'n21') {
		authHelper.isAuthenticated(req).then((isAuthenticated) => {
			const template = isAuthenticated ? 'dataprivacy/privacy_logged_in' : 'dataprivacy/privacy_guests';
			if (isAuthenticated) {
				return authHelper.populateCurrentUser(req, res)
					.then(() => authHelper.restrictSidebar(req, res))
					.then(() => Promise.resolve(template));
			}
			return Promise.resolve(template, isAuthenticated);
		}).then((template, isAuthenticated) => {
			res.render(template, {
				title: res.$t('dataprivacy.headline.privacyPolicy'),
				inline: isAuthenticated,
			});
		}).catch(next);
	} else {
		res.redirect(createRedirectionLink());
	}
});

module.exports = router;
