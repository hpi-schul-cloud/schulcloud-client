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

router.post('/', (req, res, next) => {
	const { body } = req;
	const dateTimePickerMask = res.$t('format.dateTimePickerMask');
	const datePickerPlaceholder = dateTimePickerMask.replace(/[0-9]/g, '_');

	if (body.displayAt && body.displayAt !== datePickerPlaceholder) {
		// rewrite german format to ISO
		body.displayAt = timesHelper.createFromString(body.displayAt, dateTimePickerMask).toISOString();
	} else {
		body.displayAt = undefined;
	}
	body.creatorId = res.locals.currentUser._id;
	body.createdAt = timesHelper.currentDate().toISOString();

	if (body.context) {
		body.target = body.contextId;
		body.targetModel = body.context;
	}

	api(req)
		.post('/news/', {
			// TODO: sanitize
			json: body,
		})
		.then(() => {
			if (body.context) {
				res.redirect(`/${body.context}/${body.contextId}/?activeTab=news`);
			} else {
				res.redirect('/news');
			}
		})
		.catch((err) => {
			next(err);
		});
});

router.patch('/:newsId', (req, res, next) => {
	req.body.displayAt = timesHelper.createFromString(
		req.body.displayAt,
		res.$t('format.dateTimeToPicker'),
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

router.get('/new', (req, res, next) => {
	const context = req.query.context || '';
	const contextId = req.query.contextId || '';
	res.render('news/edit', {
		title: res.$t('news._news.headline.createNews'),
		submitLabel: res.$t('global.button.add'),
		closeLabel: res.$t('global.button.cancel'),
		method: 'post',
		action: '/news/',
		context,
		contextId,
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
