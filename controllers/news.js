/*
 * One Controller per layout view
 */

// TODO remove controller

const express = require('express');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const timesHelper = require('../helpers/timesHelper');

const router = express.Router();

router.use(authHelper.authChecker);

const VERSION = 'v3';

const getDeleteHandler = (service) => (req, res, next) => {
	api(req, { version: VERSION })
		.delete(`/${service}/${req.params.id}`)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

router.delete('/:id', getDeleteHandler('news'));

router.all('/', async (req, res, next) => {
	const itemsPerPage = 9;
	const currentPage = parseInt(req.query.p, 10) || 1;
	const context = req.originalUrl.split('/')[1];

	const queryObject = {
		limit: itemsPerPage,
		skip: itemsPerPage * (currentPage - 1),
	};

	if (context === 'teams') {
		queryObject.targetModel = 'teams';
		queryObject.target = req.originalUrl.split('/')[2] || {};
	}

	const decorateNews = (newsItem) => {
		const isRSS = newsItem.source === 'rss';
		const secondaryTitle = timesHelper.fromUTC(newsItem.displayAt).fromNow();

		return {
			...newsItem,
			isRSS,
			url: `/news/${newsItem.id}`,
			secondaryTitle,
			actions: [],
		};
	};

	try {
		const news = await api(req, { version: VERSION }).get('/news/', {
			qs: queryObject,
		});
		const totalNews = news.total;
		const mappedNews = news.data.map((newsItem) => decorateNews(newsItem));

		const unpublishedNews = await api(req, { version: VERSION }).get('/news/', {
			qs: {
				unpublished: true,
				limit: 100, // TODO PAGINATION
				skip: 0,
			},
		});
		const unpublishedMappedNews = {
			...unpublishedNews,
			data: unpublishedNews.data.map((item) => decorateNews(item)),
		};

		const pagination = {
			currentPage,
			numPages: Math.ceil(totalNews / itemsPerPage),
			baseUrl: '/news/?p={{page}}',
		};

		let title = res.$t('global.headline.news');
		// ToDo: Hier kommen noch News für Kurse und Klassen rein.
		if (context === 'teams') {
			title = res.$t('news.headline.newsTeam');
		}

		res.render('news/overview', {
			title,
			unpublishedNews: unpublishedMappedNews,
			news: mappedNews,
			pagination,
			searchLabel: res.$t('news.label.searchForNews'),
			searchAction: '/news/',
			showSearch: true,
		});
	} catch (err) {
		next(err);
	}
});

router.get('/:newsId', (req, res, next) => {
	api(req, { version: VERSION })
		.get(`/news/${req.params.newsId}`)
		.then((news) => {
			const updatedAtNotEqualCreatedAt = !(news.updatedAt === news.createdAt) && (news.updatedAt !== undefined);
			res.render('news/article', {
				title: news.title,
				news,
				updatedAtNotEqualCreatedAt,
				isRSS: news.source === 'rss',
			});
		})
		.catch((err) => {
			next(err);
		});
});

module.exports = router;
