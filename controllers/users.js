const express = require('express');

const router = express.Router();
const api = require('../api');
const { getAllPaginatedData } = require('../helpers/apiData');


// users

router.get('/teachersOfSchool', async (req, res, next) => {
	try {
		const users = await getAllPaginatedData(req, '/publicTeachers/', {
			qs: {
				schoolId: req.query.schoolId,
				$sort: 'firstName',
			},
		});

		const result = users.map((user) => ({
			_id: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
		}));

		return res.json(result);
	} catch (e) {
		const error = new Error(res.$t('global.text.invalidRequest'));
		error.status = 400;
		return next(error);
	}
});

module.exports = router;
