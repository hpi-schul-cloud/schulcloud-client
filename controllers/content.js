const express = require('express');

const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

const contentFilterSettings = (res) => [
	{
		type: 'sort',
		title: res.$t('global.headline.sorting'),
		displayTemplate: res.$t('global.label.sortBy'),
		options: [
			['updatedAt', res.$t('content.text.date')],
			['providerName', res.$t('content.text.provider')],
			['clickCount', res.$t('content.text.popularity')],
		],
		defaultOrder: 'DESC',
	},
	{
		type: 'limit',
		title: res.$t('global.headline.entriesPerPage'),
		displayTemplate: res.$t('global.label.entriesPerPage'),
		options: [9, 18, 24, 48, 99],
		defaultSelection: 9,
	},
	{
		type: 'select',
		title: res.$t('content.headline.fileType'),
		displayTemplate: res.$t('content.label.fileType'),
		property: 'mimeType',
		multiple: true,
		expanded: true,
		options: [
			['text/html', res.$t('content.text.text')],
			['video', res.$t('content.text.video')],
		],
	},
];

router.get('/', (req, res, next) => {
	const query = req.query.q;
	const action = 'addToLesson';

	// Featured Content
	if (!query) {
		return Promise.all([
			api(req)({
				uri: '/content/resources/',
				qs: {
					featuredUntil: {
						$gte: new Date(),
					},
				},
				json: true,
			}),
			api(req)({
				uri: '/content/resources/',
				qs: {
					$sort: {
						clickCount: -1,
					},
					$limit: 3,
				},
				json: true,
			}),
		]).then(([featured, trending]) => res.render('content/store', {
			title: res.$t('content.headline.contentStore'),
			featuredContent: featured.data,
			trendingContent: trending.data,
			totalCount: trending.total,
			isCourseGroupTopic: req.query.isCourseGroupTopic,
			inline: req.query.inline,
			action,
		})).catch(next);
		// Search Results
	}
	const tempOrgQuery = (req.query || {}).filterQuery;
	const filterQueryString = (tempOrgQuery) ? (`&filterQuery=${escape(tempOrgQuery)}`) : '';

	let itemsPerPage = 9;
	let filterQuery = {};
	if (tempOrgQuery) {
		filterQuery = JSON.parse(unescape(tempOrgQuery));
		if (filterQuery.$limit) {
			itemsPerPage = filterQuery.$limit;
		}
	}

	const currentPage = parseInt(req.query.p) || 1;

	let dbQuery = {
		_all: { $match: query },
		$limit: itemsPerPage,
		$skip: itemsPerPage * (currentPage - 1),
	};
	dbQuery = Object.assign(dbQuery, filterQuery);

	return api(req)({
		uri: '/content/search/',
		qs: dbQuery,
		json: true,
	}).then((searchResults) => {
		const pagination = {
			currentPage,
			numPages: Math.ceil(searchResults.total / itemsPerPage),
			baseUrl: `${req.baseUrl}/?q=${query}&p={{page}}&${filterQueryString}`,
		};
		return res.render('content/store', {
			title: res.$t('content.headline.contentStore'),
			query,
			searchResults: (searchResults.total) ? searchResults : undefined,
			pagination,
			isCourseGroupTopic: req.query.isCourseGroupTopic,
			action,
			filterSettings: JSON.stringify(contentFilterSettings(res)),
		});
	}).catch(next);
});

router.get('/:id', (req, res, next) => {
	Promise.all([
		api(req).get('/courses/', {
			qs: {
				teacherIds: res.locals.currentUser._id,
				$limit: -1,
			},
		}),
		api(req).get(`/content/resources/${req.params.id}`, {
			json: true,
		}),
	]).then(([courses, content]) => {
		// Fix "client" <==> "providerName"
		content.client = content.providerName;
		// Set URL for Redirect
		content.url = `/content/redirect/${content._id}`;
		res.json({
			courses,
			content,
		});
	}).catch(next);
});

router.get('/redirect/:id', (req, res, next) => api(req)({
	uri: `/content/redirect/${req.params.id}`,
	followRedirect: false,
	resolveWithFullResponse: true,
	simple: false,
}).then((response) => {
	if (response.statusCode === 302) {
		res.redirect(response.headers.location);
	} else { // handle non 5xx, e.g. 404
		next();
	}
}).catch(next));

router.post('/addToLesson', (req, res, next) => {
	api(req).post('/materials/', {
		json: req.body,
	}).then((material) => {
		api(req).patch(`/lessons/${req.body.lessonId}`, {
			json: {
				courseId: req.body.courseId,
				$push: {
					materialIds: material._id,
				},
			},
		}).then((result) => {
			res.redirect(`/content/?q=${req.body.query}`);
		});
	}).catch(next);
});

module.exports = router;
