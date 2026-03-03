const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const router = express.Router();
const ghostBaseUrl = Configuration.get('GHOST_BASE_URL');

router.get('/', async (req, res) => {
	try {
		const response = await axios.get(`${ghostBaseUrl}/rss`, {
			timeout: 2000,
			headers: {
				Accept: 'application/rss+xml, application/xml, text/xml',
			},
		});

		const parsedData = await parseStringPromise(response.data);
		let blogFeed;
		try {
			blogFeed = parsedData.rss.channel[0].item
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
	} catch {
		res.send({
			blogFeed: [],
		});
	}
});

module.exports = router;
