const express = require('express');
const { URL } = require('url');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const { DOCUMENT_BASE_DIR, SC_THEME } = require('../config/global');
const { specificFiles } = require('../config/documents');

const router = express.Router();

const privacyUrl = () => {
	const privacyFile =	SC_THEME === 'open' || SC_THEME === 'demo'
		? specificFiles.privacy
		: specificFiles.privacyExemplary;
	return new URL(`${SC_THEME}/${privacyFile}`, DOCUMENT_BASE_DIR);
};

const downloadPolicyPdf = (res, fileData, fileTitle) => {
	const download = Buffer.from(fileData, 'base64');
	res.writeHead(200, {
		'Content-Type': 'application/pdf',
		'Content-Disposition': `attachment; filename="${fileTitle}.pdf"`,
	}).end(download);
};

const getBase64File = async (req, res, fileId, fileTitle) => {
	if (fileId) {
		const base64File = await api(req).get(`/base64Files/${fileId}`);
		if (base64File.data) {
			const fileData = base64File.data.replace(
				'data:application/pdf;base64,',
				'',
			);
			downloadPolicyPdf(res, fileData, fileTitle);
		}
	}
};

router.get('/', async (req, res, next) => {
	try {
		const isAuthenticated = await authHelper.isAuthenticated(req);
		const qs = {
			$limit: 1,
			consentTypes: 'privacy',
			$sort: {
				publishedAt: -1,
			},
		};

		if (isAuthenticated && res.locals.currentSchool) {
			qs.schoolId = res.locals.currentSchool;
		}

		const consentVersions = await api(req).get('/consentVersions', { qs });

		if (consentVersions.data.length) {
			const fileId = consentVersions.data[0].consentDataId;
			if (!fileId) {
				res.redirect(privacyUrl());
			}
			const fileTitle = consentVersions.data[0].title;
			await getBase64File(req, res, fileId, fileTitle);
		} else {
			res.redirect(privacyUrl());
		}
	} catch (err) {
		next(err);
	}
});

module.exports = router;
