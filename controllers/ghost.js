const express = require('express');
const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise');

const router = express.Router();

router.get('/:slug', async (req, res, next) => {

    try {
        const contentApiKey = Configuration.get('N21_BLOG_CONTENT_API_KEY');
        const options = {
			uri: `https://blog.niedersachsen.cloud/ghost/api/v2/content/pages/slug/${req.params.slug}/`,
			qs: {
				key: contentApiKey,
				fields: 'html,title',
			},
			json: true,
			timeout: 8000,
		};

		try {
			const page = await request(options);
			return res.json(page);
		} catch (error) {
			return res.status(400).send(error);
        }
    } catch (error) {
        return res.status(400).send(error);
    }
});

module.exports = router;
