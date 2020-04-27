const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise');

const router = express.Router();

let cache = null;
let lastUpdatedTimestamp = 0;

router.get('/:slug', async (req, res, next) => {
	if (!Configuration.has('GHOST_API_KEY') || !Configuration.has('GHOST_API_URL')) {
		return next(new Error('GHOST_API_URL or/and GHOST_API_KEY are not defined'));
	}

	if (lastUpdatedTimestamp < Date.now() - 1000 * 60 * 5) {
		const options = {
			uri: `${Configuration.get('GHOST_API_URL')}/content/pages/slug/${req.params.slug}/`,
			qs: {
				key: Configuration.get('GHOST_API_KEY'),
				fields: 'html,title',
			},
			json: true,
			timeout: Configuration.get('REQUEST_TIMEOUT_MS'),
		};

		await request(options)
			.then((page) => {
				cache = page;
				lastUpdatedTimestamp = Date.now();
				return res.json(page);
			})
			.catch(next);
	} else {
		return res.json(cache);
	}
});

module.exports = router;
