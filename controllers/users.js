const express = require('express');

const router = express.Router();
const api = require('../api');

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

		const result = users.data.map(user => ({
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

router.patch('/language/', async (req, res, next) => {
	try {
		const newLanguage = req.body.language;

		await api(req).patch(`/v3/language/${newLanguage}`);

		res.status(200);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
