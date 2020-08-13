const express = require('express');

const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	const query = req.query.q;
	return res.render('my-material/my-material', {
		title: res.$t('my_material.headline.myMaterial'),
	});
});

module.exports = router;
