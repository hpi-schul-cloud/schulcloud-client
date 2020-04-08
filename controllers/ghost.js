const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise');

const router = express.Router();

router.get('/:slug', async (req, res, next) => {

	if (!Configuration.has('GHOST_API_KEY') || !Configuration.has('GHOST_API_URL')) {
		return next(new Error('GHOST_API_URL or/and GHOST_API_KEY are not defined'));
	}

	const options = {
		uri: `${Configuration.get('GHOST_API_URL')}/content/pages/slug/${req.params.slug}/`,
		qs: {
			key: Configuration.get('GHOST_API_KEY'),
			fields: 'html,title',
		},
		json: true,
		timeout: Configuration.get('REQUEST_TIMEOUT_MS'),
	};

	return request(options)
		.then((page) => res.json(page))
		.catch(next);

});

module.exports = router;
