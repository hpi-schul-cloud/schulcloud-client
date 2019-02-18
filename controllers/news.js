/*
 * One Controller per layout view
 */

const express = require('express');
const moment = require('moment');
const marked = require('marked');
const handlebars = require('handlebars');
const _ = require('lodash');
const api = require('../api');
const authHelper = require('../helpers/authentication');

const router = express.Router();
moment.locale('de');

router.use(authHelper.authChecker);

const getActions = (item, path) => {
	return [
		{
			link: path + item._id + "/edit",
			class: 'btn-edit',
			icon: 'edit',
			alt: 'bearbeiten'
		},
		{
			link: path + item._id,
			class: 'btn-delete',
			icon: 'trash-o',
			method: 'delete',
			alt: 'löschen'
		}
	];
};

const getDeleteHandler = (service) => {
	return (req, res, next) => {
		api(req).delete('/' + service + '/' + req.params.id).then(_ => {
			res.sendStatus(200);
		}).catch(err => {
			next(err);
		});
	};
};

router.post('/', function (req, res, next) {
	let { body } = req;
	if (body.displayAt && body.displayAt != "__.__.____ __:__") { // rewrite german format to ISO
		body.displayAt = moment(body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();
	} else {
		body.displayAt = undefined;
	}
	body.creatorId = res.locals.currentUser._id;
	body.createdAt = moment().toISOString();

	if (body.context) {
		body.target = body.targetId;
		body.targetModel = body.context;
	}

	api(req).post('/news/', {
		// TODO: sanitize
		json: body
	}).then(data => {
		if (body.context) {
			res.redirect(`/${body.context}/` + body.targetId);
		}
		res.redirect('/news');
	}).catch(err => {
		next(err);
	});
});
router.patch('/:newsId', (req, res, next) => {
	api(req).get('/news/' + req.params.newsId, {}).then(orgNews => {
		req.body.displayAt = moment(req.body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();

		const historyEntry = {
			"title": orgNews.title,
			"content": orgNews.content,
			"displayAt": orgNews.displayAt,

			"creatorId": (orgNews.updaterId) ? (orgNews.updaterId) : (orgNews.creatorId),
			"parentId": req.params.newsId
		};

		api(req).post('/newshistory/', {
			// TODO: sanitize
			json: historyEntry
		}).then(data => {
			req.body.updaterId = res.locals.currentUser._id;
			req.body.updatedAt = moment().toISOString();
			orgNews.history.push(data._id);
			req.body.history = orgNews.history;

			api(req).patch('/news/' + req.params.newsId, {
				// TODO: sanitize
				json: req.body
			}).then(data => {
				res.redirect('/news');
			}).catch(err => {
				next(err);
			});


		}).catch(err => {
			next(err);
		});
	}).catch(err => {
		next(err);
	});
});
router.delete('/:id', getDeleteHandler('news'));

router.all('/', async (req, res, next) => {
	const query = req.query.q;
	const itemsPerPage = 9;
	const currentPage = parseInt(req.query.p, 10) || 1;
	const context = req.originalUrl.split('/')[1];


	let queryObject = {
		$limit: itemsPerPage,
		displayAt: (res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT')) ? {} : { $lte: new Date().getTime() },
		$skip: (itemsPerPage * (currentPage - 1)),
		$sort: '-displayAt',
		title: { $regex: query, $options: 'i' },
		$populate: ['target']
	};

	if (req.params.targetId) { // FIXME this will actually never execute, since there is no params in the route handler.
		queryObject.target = req.params.targetId;
	}

	if (!query) delete queryObject.title;

	try {
		const news = await api(req).get('/news/', { qs: queryObject })
		const totalNews = news.total;
		const colors = ["#F44336", "#E91E63", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "4CAF50", "CDDC39", "FFC107", "FF9800", "FF5722"];
		const mappedNews = news.data.map((newsItem) => {
			const isRSS = newsItem.source === 'rss';
			return {
				...newsItem,
				isRSS,
				url: `/news/${newsItem._id}`,
				secondaryTitle: moment(newsItem.displayAt).fromNow(),
				background: colors[_.random(0, colors.length - 1)],
				actions: !isRSS && res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT') && getActions(news, '/news/'),
			};
		});


		const pagination = {
			currentPage,
			numPages: Math.ceil(totalNews / itemsPerPage),
			baseUrl: '/news/?p={{page}}',
		};

		let title = 'Neuigkeiten aus meiner Schule';
		// ToDo: Hier kommen noch News für Kurse und Klassen rein.
		switch (context) {
			case 'teams': {
				title = 'Neuigkeiten aus meinem Team';
			}
		}

		res.render('news/overview', {
			title,
			news: mappedNews,
			pagination,
			searchLabel: 'Suche nach Neuigkeiten',
			searchAction: '/news/',
			showSearch: true,
		});
	} catch (err) {
		next(err);
	}
});

router.get('/new', function (req, res, next) {
	let context = req.originalUrl.split('/')[1];
	context = ['teams', 'courses', 'class'].includes(context) ? context : '';
	res.render('news/edit', {
		title: "News erstellen",
		submitLabel: 'Hinzufügen',
		closeLabel: 'Abbrechen',
		method: 'post',
		action: '/news/',
		context,
		targetId: req.params.targetId
	});
});


router.get('/:newsId', (req, res, next) => {
	api(req).get(`/news/${req.params.newsId}`, {
		qs: {
			$populate: ['creatorId', 'updaterId'],
		},
	}).then((news) => {
		news.url = '/news/' + news._id;
		res.render('news/article', { title: news.title, news, isRSS: true, });
	}).catch(err => {
		next(err);
	});
});

router.get('/:newsId/edit', function (req, res, next) {
	api(req).get('/news/' + req.params.newsId, {}).then(news => {
		news.displayAt = moment(news.displayAt).format('DD.MM.YYYY HH:mm');
		res.render('news/edit', {
			title: "News bearbeiten",
			submitLabel: 'Speichern',
			closeLabel: 'Abbrechen',
			method: 'patch',
			action: '/news/' + req.params.newsId,
			news
		});
	}).catch(err => {
		next(err);
	});
});

module.exports = router;