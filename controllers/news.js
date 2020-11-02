/*
 * One Controller per layout view
 */

const express = require('express');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const timesHelper = require('../helpers/timesHelper');

const router = express.Router();

router.use(authHelper.authChecker);

const createActions = (item, path) => {
	const actions = [];
	// temporarily removed actions on cards...
	// if (item.permissions && item.permissions.includes('NEWS_EDIT')) {
	// 	actions.push(
	// 		{
	// 			link: `${path + item._id}/edit`,
	// 			class: 'btn-edit',
	// 			icon: 'pencil',
	// 			method: 'GET',
	// 			alt: 'bearbeiten',
	// 		},
	// 	);
	// }
	// if (item.permissions && item.permissions.includes('NEWS_EDIT')) {
	// 	// todo change to NEWS_REMOVE
	// 	actions.push({
	// 		link: path + item._id,
	// 		class: 'btn-delete',
	// 		icon: 'trash-o',
	// 		method: 'DELETE',
	// 		alt: 'löschen',
	// 	});
	// }
	return actions;
};

const getActions = (isRSS, res, newsItem) => !isRSS && createActions(newsItem, '/news/');

const getDeleteHandler = (service) => (req, res, next) => {
	api(req)
		.delete(`/${service}/${req.params.id}`)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

router.patch('/:newsId', (req, res, next) => {
	req.body.displayAt = timesHelper.dateTimeStringToMoment(
		req.body.displayAt,
	).toISOString();
	req.body.updatedAt = timesHelper.currentDate().toISOString();
	req.body.updaterId = res.locals.currentUser._id;

	api(req)
		.patch(`/news/${req.params.newsId}`, {
			json: req.body,
		})
		.then(() => {
			res.redirect('/news');
		})
		.catch((err) => {
			next(err);
		});
});

router.delete('/:id', getDeleteHandler('news'));

router.all('/', async (req, res, next) => {
	const itemsPerPage = 9;
	const currentPage = parseInt(req.query.p, 10) || 1;
	const context = req.originalUrl.split('/')[1];

	const queryObject = {
		$limit: itemsPerPage,
		$skip: itemsPerPage * (currentPage - 1),
		sort: '-displayAt',
		q: req.query.q,
	};

	if (context === 'teams') {
		queryObject.targetModel = 'teams';
		queryObject.target = req.originalUrl.split('/')[2] || {};
	}

	const decorateNews = (newsItem) => {
		const isRSS = newsItem.source === 'rss';
		return {
			...newsItem,
			isRSS,
			url: `/news/${newsItem._id}`,
			secondaryTitle: timesHelper.fromUTC(newsItem.displayAt).fromNow(),
			actions: getActions(isRSS, res, newsItem),
		};
	};

	try {
		const news = await api(req).get('/news/', { qs: queryObject });
		const totalNews = news.total;
		const mappedNews = news.data.map((newsItem) => decorateNews(newsItem));

		const unpublishedNews = await api(req).get('/news/', {
			qs: {
				sort: '-displayAt',
				unpublished: true,
				limit: 0,
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

router.get('/:newsId/edit', (req, res, next) => {
	api(req)
		.get(`/news/${req.params.newsId}`, {})
		.then((news) => {
			news.displayAt = timesHelper.fromUTC(news.displayAt);
			res.render('news/edit', {
				title: res.$t('news._news.headline.editNews'),
				submitLabel: res.$t('global.button.save'),
				closeLabel: res.$t('global.button.cancel'),
				method: 'patch',
				action: `/news/${req.params.newsId}`,
				news,
			});
		})
		.catch((err) => {
			next(err);
		});
});

module.exports = router;
