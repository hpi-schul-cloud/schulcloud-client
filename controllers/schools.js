const express = require('express');

const router = express.Router();
const api = require('../api');

// This route is only used for the external invite form. That's why the API call is specific for that.
router.get('/', async (req, res, next) => {
	const params = {
		qs: {
			$limit: req.query.$limit,
			federalStateId: req.query.federalState,
		},
	};

	try {
		const response = await api(req, { version: 'v3' }).get('/school/list-for-external-invite', params);
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
