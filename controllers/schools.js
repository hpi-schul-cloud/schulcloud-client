const express = require('express');

const router = express.Router();
const api = require('../api');

// schools

router.get('/', async (req, res, next) => {
	const params = {
		qs: {
			$limit: req.query.$limit,
			federalState: req.query.federalState,
			$sort: 'name',
		},
	};
	if (req.query.hideOwnSchool) {
		params.qs._id = { $ne: res.locals.currentSchool };
	}
	try {
		const schools = await api(req).get('/schools/', params);

		const result = schools.data.map((school) => ({
			_id: school._id,
			name: school.name,
			purpose: school.purpose,
			officialSchoolNumber: school.officialSchoolNumber,
		}));

		return res.json(result);
	} catch (e) {
		const error = new Error(res.$t('global.text.invalidRequest'));
		error.status = 400;
		return next(error);
	}
});
module.exports = router;
