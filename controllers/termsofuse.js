const express = require('express');
const { URL } = require('url');
const { DOCUMENT_BASE_DIR, SC_THEME } = require('../config/global');
const { specificFiles } = require('../config/documents');
const { getBase64File } = require('../helpers/fileHelper');
const { getConsentVersion } = require('../helpers/consentVersionHelper');

const router = express.Router();

const termsUrl = () => new URL(`${SC_THEME}/${specificFiles.termsOfUseSchool}`, DOCUMENT_BASE_DIR);

router.get('/', async (req, res, next) => {
	try {
		const consentVersions = await getConsentVersion(req, res, 'termsOfUse');

		if (consentVersions.data.length) {
			const fileId = consentVersions.data[0].consentDataId;
			if (!fileId) {
				res.redirect(termsUrl().toString());
			}

			const fileTitle = res.$t('global.text.termsOfUseFile');

			await getBase64File(req, res, fileId, fileTitle);
		} else {
			res.redirect(termsUrl().toString());
		}
	} catch (err) {
		next(err);
	}
});

module.exports = router;
