const express = require('express');
const { Configuration } = require('@hpi-schul-cloud/commons');
const axios = require('axios');

const router = express.Router();

const cache = {};

router.get('/:slug', async (req, res, next) => {
	if (!Configuration.has('GHOST_API_KEY') || !Configuration.has('GHOST_BASE_URL')) {
		return next(new Error('GHOST_BASE_URL or/and GHOST_API_KEY are not defined'));
	}

	const { slug } = req.params;

	// Validate slug to protect from SSRF
	if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
		return res.status(400).json({ error: 'Invalid slug format' });
	}

	if (!cache[slug] || cache[slug].lastUpdatedTimestamp < Date.now() - 1000 * 60 * 5) {
		const options = {
			url: `${Configuration.get('GHOST_BASE_URL')}/ghost/api/v3/content/pages/slug/${slug}/`,
			params: {
				key: Configuration.get('GHOST_API_KEY'),
				fields: 'html,title',
			},
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		await axios(options)
			.then((axiosRes) => {
				const page = axiosRes.data;
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
