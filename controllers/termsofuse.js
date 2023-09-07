const express = require('express');
const { URL } = require('url');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const { DOCUMENT_BASE_DIR, SC_THEME } = require('../config/global');
const { specificFiles } = require('../config/documents');

const router = express.Router();

const termsUrl = () => new URL(`${SC_THEME}/${specificFiles.termsOfUseSchool}`, DOCUMENT_BASE_DIR);

const downloadTermsPdf = (res, fileData, fileTitle) => {
	// ERR_INVALID_CHAR will get thrown on ukrainian translation without encoding
	const encodedFileTitle = encodeURI(fileTitle);
	const download = Buffer.from(fileData, 'base64');
	res.writeHead(200, {
		'Content-Type': 'application/pdf',
		'Content-Disposition': `attachment; filename="${encodedFileTitle}.pdf"`,
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
			downloadTermsPdf(res, fileData, fileTitle);
		}
	}
};

router.get('/', async (req, res, next) => {
	try {
		const isAuthenticated = await authHelper.isAuthenticated(req);
		const qs = {
			$limit: 1,
			consentTypes: ['termsOfUse'],
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
