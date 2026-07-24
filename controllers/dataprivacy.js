const express = require('express');
const { URL } = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { specificFiles } = require('../config/documents');
const { getBase64File } = require('../helpers/fileHelper');
const { getConsentVersion } = require('../helpers/consentVersionHelper');
const authHelper = require('../helpers/authentication');
const logger = require('../helpers/logger');

const SC_THEME = Configuration.get('SC_THEME');
const DOCUMENT_BASE_DIR = Configuration.get('DOCUMENT_BASE_DIR');

const router = express.Router();

const privacyUrl = () => new URL(`${SC_THEME}/${specificFiles.privacy}`, DOCUMENT_BASE_DIR);

router.get('/', async (req, res, next) => {
	try {
		const consentVersions = await getConsentVersion(req, res, 'privacy');

		if (consentVersions.data.length) {
			const fileId = consentVersions.data[0].consentDataId;
			if (!fileId) {
				return res.redirect(privacyUrl().toString());
			}

			const fileTitle = res.locals.theme.name === 'thr'
				? res.$t('global.text.dataProtectionFileThr')
				: res.$t('global.text.dataProtectionFile');

			return await getBase64File(req, res, fileId, fileTitle);
		}

		return res.redirect(privacyUrl().toString());
	} catch (err) {
		if (err.statusCode === 401) {
			await authHelper.clearCookies(req, res, { destroySession: true })
				.catch((clearError) => {
					logger.error('error clearing session while loading privacy policy', clearError);
				});
			return res.redirect(privacyUrl().toString());
		}
		return next(err);
	}
});

module.exports = router;
