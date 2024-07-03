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

router.get('/confluence/:id', (req, res, next) => {
	res.render('help/confluence', {
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
			},
		],
		articleId: req.params.id,
		pageTitle: res.$t('help.headline.helpSection'),
	});
});

router.get('/faq/people', (req, res, next) => {
	res.render('help/people', {
		title: res.$t('help.headline.contactDetails'),
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
			},
		],
	});
});

router.get('/lernNuggets', (req, res, next) => {
	res.render('help/lern-nuggets', {
		title: res.$t('help.headline.privacyCourse'),
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
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
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help/articles',
			},
		],
		sections: documents,
	});
});

module.exports = router;
