const express = require('express');
const feedr = require('feedr').create();

const router = express.Router();

router.get('/', (req, res) => {
	feedr.readFeed('https://blog.hpi-schul-cloud.de/rss', {
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
