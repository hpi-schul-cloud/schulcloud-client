const express = require('express');

const router = express.Router();
const api = require('../api');
const { setCookie } = require('../helpers/cookieHelper');
const { isUserHidden } = require('../helpers/users');

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

		users.data = users.data.filter((user) => !isUserHidden(user, res.locals.currentSchoolData));

		const result = users.data.map((user) => ({
			_id: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
			schoolId: user.schoolId,
			email: user.email,
			outdatedSince: user.outdatedSince,
		}));

		return res.json(result);
	} catch (err) {
		const error = new Error(res.$t('global.text.invalidRequest'));
		error.status = 400;
		return next(error);
	}
});

router.get('/teachersWithEmail', async (req, res, next) => {
	try {
		const users = await api(req).get('/publicTeachers/', {
			qs: {
				$limit: false,
				email: req.query.email,
				$sort: 'firstName',
				$populate: ['schoolId'],
			},
		});

		users.data = users.data.filter((user) => !isUserHidden(user, res.locals.currentSchoolData));

		const result = users.data.map((user) => ({
			_id: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
			schoolName: user.schoolId.name,
			outdatedSince: user.outdatedSince,
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
		const { language } = req.body;

		await api(req, { version: 'v3' }).patch('/user/language', { json: { language } });
		setCookie(res, 'USER_LANG', language);
		return res.json({});
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
