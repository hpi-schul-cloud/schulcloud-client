const express = require('express');
const feedr = require('feedr').create();
const { Configuration } = require('@hpi-schul-cloud/commons');

const router = express.Router();
const ghostBaseUrl = Configuration.get('GHOST_BASE_URL');

router.get('/', (req, res) => {
	feedr.readFeed(`${ghostBaseUrl}/rss`, {
		requestOptions: { timeout: 2000 },
	}, (err, data) => {
		let blogFeed;
		try {
			blogFeed = data.rss.channel[0].item
				.filter((item) => (item['media:content'] || []).length && (item.link || []).length)
				.slice(0, 3)
				.map((e) => {
					const date = new Date(e.pubDate);
					const locale = 'en-us';
					const month = date.toLocaleString(locale, { month: 'long' });
					e.pubDate = `${date.getDate()}. ${month}`;
					e.description = e.description.join(' ');
					e.url = e.link[0];
					e.img = {
						src: e['media:content'][0].$.url,
						alt: e.title,
					};
					return e;
				});
		} catch (e) {
			blogFeed = [];
		}
		res.send({
			blogFeed,
		});
	});
});

module.exports = router;
