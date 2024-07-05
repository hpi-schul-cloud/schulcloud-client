const express = require('express');
const moment = require('moment');
const { Converter } = require('showdown');
const authHelper = require('../helpers/authentication');
const api = require('../api');
const contactHelper = require('../helpers/contactHelper');

const router = express.Router();
const converter = new Converter();

// read here for updating the tutorials.json: https://docs.dbildungscloud.de/display/Intern/Hilfe-Artikel+aktualisieren
const tutorials = require('../helpers/content/tutorials.json');

// secure routes
router.use(authHelper.authChecker);

router.get('/articles', (req, res, next) => {
	res.render('help/help', {
		title: res.$t('help.headline.helpSection'),
		tutorials,
		userEmail: res.locals.currentUser.source ? '' : res.locals.currentUser.email,
	});
});

router.get('/', (req, res, next) => {
	return res.redirect('/help/articles');
});

router.get('/contact', (req, res, next) => {
	res.render('help/contact', {
		title: res.$t('global.link.contact'),
		adminFormIsActive: true,
		helpOptions: contactHelper.getSortedHelpOtions(res),
	});
});

router.get('/releases', (req, res, next) => {
	api(req).get('/releases', {
		qs: {
			$sort: '-createdAt',
		},
	})
		.then((releases) => {
			// eslint-disable-next-line array-callback-return
			releases.data.map((release) => {
				release.body = converter.makeHtml(release.body);
				release.publishedAt = moment(release.publishedAt).format('ddd, ll');
			});

			res.render('help/releases', {
				breadcrumbs: [
					{
						title: res.$t('help.headline.helpSection'),
						url: '/help/articles',
						dataTestId: 'navigate-to-help-article-from-release-note',
					},
				],
				release: releases.data,
				title: 'Release Notes',
			});
		});
});

router.get('/confluence/:id', (req, res, next) => {
	res.render('help/confluence', {
		breadcrumbs: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
				dataTestId: 'navigate-to-help-article',
			},
		],
		articleId: req.params.id,
		pageTitle: res.$t('help.headline.helpSection'),
	});
});

router.get('/faq/people', (req, res, next) => {
	res.render('help/people', {
		title: res.$t('help.headline.contactDetails'),
		breadcrumbs: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
				dataTestId: 'navigate-to-help-article-from-contact',
			},
		],
	});
});

router.get('/lernNuggets', (req, res, next) => {
	res.render('help/lern-nuggets', {
		title: res.$t('help.headline.privacyCourse'),
		breadcrumbs: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
				dataTestId: 'navigate-to-help-article-from-document',
			},
		],
	});
});

router.get('/faq/documents', async (req, res, next) => {
	const documents = await api(req)
		.get('/help/documents/', { qs: { theme: res.locals.theme.name } })
		.catch(() => {
			req.session.notification = {
				type: 'danger',
				message: res.$t('help.text.noWelcomeDocuments'),
			};
			return res.redirect('/help');
		});

	return res.render('help/accordion-sections', {
		title: res.$t('help.headline.documentsToDownload'),
		breadcrumbs: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
				dataTestId: 'navigate-to-help-article-from-document',
			},
		],
		sections: documents,
	});
});


module.exports = router;
