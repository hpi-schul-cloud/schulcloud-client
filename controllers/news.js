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
			method: 'GET',
			alt: 'bearbeiten'
		},
		{
			link: path + item._id,
			class: 'btn-delete',
			icon: 'trash-o',
			method: 'DELETE',
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
		body.target = body.contextId;
		body.targetModel = body.context;
	}

	api(req).post('/news/', {
		// TODO: sanitize
		json: body
	}).then(data => {
		if (body.context) {
			res.redirect(`/${body.context}/` + body.contextId + '/?activeTab=news');
		} else {
			res.redirect('/news');
		}
	}).catch(err => {
		next(err);
	});
});
router.patch('/:newsId', (req, res, next) => {
	req.body.displayAt = moment(req.body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();
	req.body.updatedAt = moment().toISOString();
	req.body.updaterId = res.locals.currentUser._id;

	api(req).patch('/news/' + req.params.newsId, {
		json: req.body
	}).then(() => {
		res.redirect('/news');
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

	if (!query) delete queryObject.title;

	try {
		const news = await api(req).get('/news/', { qs: queryObject })
		const totalNews = news.total;
		const mappedNews = news.data.map((newsItem) => {
			const isRSS = newsItem.source === 'rss';
			return {
				...newsItem,
				isRSS,
				url: `/news/${newsItem._id}`,
				secondaryTitle: moment(newsItem.displayAt).fromNow(),
				actions: !isRSS && res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT') && getActions(newsItem, '/news/'),
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

router.get('/new', (req, res, next) => {
	const context = req.query.context || '';
	const contextId = req.query.contextId || '';
	res.render('news/edit', {
		title: "News erstellen",
		submitLabel: 'Hinzufügen',
		closeLabel: 'Abbrechen',
		method: 'post',
		action: '/news/',
		context,
		contextId,
	});
});


router.get('/:newsId', (req, res, next) => {
	api(req).get(`/news/${req.params.newsId}`, {
		qs: {
			$populate: ['creatorId', 'updaterId'],
		},
	}).then((news) => {
		news.url = '/news/' + news._id;
		res.render('news/article', { title: news.title, news, isRSS: news.source === 'rss' });
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
