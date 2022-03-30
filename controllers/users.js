const express = require('express');

const router = express.Router();
const api = require('../api');
const { setCookie } = require('../helpers/cookieHelper');

// users

router.get('/teachersOfSchool', async (req, res, next) => {
	try {
		const users = await api(req).get('/publicTeachers/', {
			qs: {
				$limit: false,
				schoolId: req.query.schoolId,
				$sort: 'firstName',
			},
		});

		const result = users.data.map((user) => ({
			_id: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
		}));

		return res.json(result);
	} catch (err) {
		const error = new Error(res.$t('global.text.invalidRequest'));
		error.status = 400;
		return next(error);
	}
});

router.patch('/language', async (req, res, next) => {
	try {
		const newLanguage = req.body.language;

		await api(req, { version: 'v3' }).patch(
			`/user/language/${newLanguage}`,
		);
		setCookie(res, 'USER_LANG', newLanguage);
		return res.json({});
	} catch (err) {
		next(err);
	}
});

module.exports = router;
