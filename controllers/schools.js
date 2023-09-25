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
		const response = await api(req, { version: 'v3' }).get('/school', params);
		const result = response.data.map((school) => ({
			_id: school.id,
			name: school.name,
			purpose: school.purpose,
		}));

		return res.json(result);
	} catch (e) {
		const error = new Error(res.$t('global.text.invalidRequest'));
		error.status = 400;
		return next(error);
	}
});

module.exports = router;
