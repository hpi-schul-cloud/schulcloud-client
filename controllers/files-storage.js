const express = require('express');

const router = express.Router();

const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);
const api = require('../api-files-storage');
const { logger, formatError } = require('../helpers');

router.get('/:parentType/:parentId', async (req, res, next) => {
	let files = [];
	const schoolId = res.locals.currentSchool;
	const { parentType, parentId } = req.params;
	try {
		const result = await api(req, { version: 'v3' }).get(`/file/list/${schoolId}/${parentType}/${parentId}`);

		if (result && result.data) {
			files = result.data;
		}
	} catch (err) {
		next(err);
	}

	res.render('files-storage/files', {
		title: res.$t('global.sidebar.link.file'),
		schoolId,
		parentId,
		parentType,
		files,
	});
});

module.exports = router;
