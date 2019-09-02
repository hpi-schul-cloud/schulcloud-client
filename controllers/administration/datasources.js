/*
 * One Controller per layout view
 */

const express = require('express');
const api = require('../../api');
const authHelper = require('../../helpers/authentication');

const router = express.Router();

router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	const context = req.query.context || '';
	const contextId = req.query.contextId || '';
	res.render('administration/datasources/overview', {
		title: 'Datenquellen',
	});
});

router.get('/:newsId', (req, res, next) => {
	api(req)
		.get(`/news/${req.params.newsId}`, {
			qs: {},
		})
		.then((news) => {
			news.url = `/news/${news._id}`;
			res.render('news/article', {
				title: news.title,
				news,
				isRSS: news.source === 'rss',
			});
		})
		.catch((err) => {
			next(err);
		});
});


module.exports = router;
