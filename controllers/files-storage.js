const express = require('express');

const router = express.Router();

const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);
const api = require('../api-files-storage');

router.get('/:parentType/:parentId', async (req, res, next) => {
	try {
		let files = [];
		const checkForObjectIdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
		const schoolId = res.locals.currentSchool;
		const { parentType, parentId } = req.params;
		const valideParentId = checkForObjectIdRegExp.test(parentId) ? parentId : undefined;

		if (valideParentId) {
			const result = await api(req, { version: 'v3' })
				.get(`/file/list/${schoolId}/${parentType}/${valideParentId}`);
			if (result && result.data) {
				files = result.data;
			}
		}

		res.render('files-storage/files', {
			title: res.$t('global.sidebar.link.file'),
			filesStorage: {
				schoolId,
				parentId: valideParentId,
				parentType,
				files,
			},
		});
	} catch (err) {
		next(err);
	}
});

module.exports = router;
