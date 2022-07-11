const express = require('express');
const { Configuration } = require('@hpi-schul-cloud/commons');
const request = require('request-promise');

const router = express.Router();

const cache = {};

router.get('/:slug', async (req, res, next) => {
	if (!Configuration.has('GHOST_API_KEY') || !Configuration.has('GHOST_BASE_URL')) {
		return next(new Error('GHOST_BASE_URL or/and GHOST_API_KEY are not defined'));
	}

	const { slug } = req.params;

	if (!cache[slug] || cache[slug].lastUpdatedTimestamp < Date.now() - 1000 * 60 * 5) {
		const options = {
			uri: `${Configuration.get('GHOST_BASE_URL')}/ghost/api/v3/content/pages/slug/${slug}/`,
			qs: {
				key: Configuration.get('GHOST_API_KEY'),
				fields: 'html,title',
			},
			json: true,
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		await request(options)
			.then((page) => {
				const element = {
					page,
					lastUpdatedTimestamp: Date.now(),
				};
				cache[slug] = element;
				return res.json(page);
			})
			.catch(next);
	} else {
		return res.json(cache[slug].page);
	}
});

module.exports = router;
