const express = require('express');

const router = express.Router();
const api = require('../api');

// schools

router.get('/', async (req, res, next) => {
	const params = {
		qs: {
			$limit: req.query.$limit,
			federalStateId: req.query.federalState,
			$sort: 'name',
		},
	};

	try {
		const response = await api(req, { version: 'v3' }).get('/school', params);
		let result = response.data.map((school) => ({
			_id: school.id,
			name: school.name,
			purpose: school.purpose,
		}));

		if (req.query.hideOwnSchool) {
			result = result.filter((school) => school._id !== res.locals.currentSchool);
		}

		return res.json(result);
	} catch (e) {
		const error = new Error(res.$t('global.text.invalidRequest'));
		error.status = 400;
		return next(error);
	}
});

module.exports = router;
