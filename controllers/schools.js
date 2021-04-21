const express = require('express');

const router = express.Router();
const api = require('../api');
const { getApiData } = require('../helpers/apiData');

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
		const schools = await getApiData(req, '/schools', params.qs);

		const result = schools.map((school) => ({
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
