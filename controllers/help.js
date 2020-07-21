const express = require('express');
const moment = require('moment');
const { Converter } = require('showdown');
const authHelper = require('../helpers/authentication');
const api = require('../api');

const { MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE } = require('../config/global');

const router = express.Router();
const converter = new Converter();

// read here for updateding the tutorials.json: https://docs.schul-cloud.org/display/Intern/Hilfe-Artikel+aktualisieren
const tutorials = require('../helpers/content/tutorials.json');

// secure routes
router.use(authHelper.authChecker);

router.get('/articles', (req, res, next) => {
	res.render('help/help', {
		title: res.$t('help.headline.helpSection'),
		tutorials,
		adminFormIsActive: req.query.activeForm === 'admin',
		teamFormIsActive: req.query.activeForm === 'team',
		formAttachmentsSize: (MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE / 1024 / 1024),
		userEmail: res.locals.currentUser.source ? '' : res.locals.currentUser.email,
	});
});

router.get('/', (req, res, next) => {
	res.render('help/dashboard', {
		title: 'Hilfebereich',
	});
});

router.get('/contact', (req, res, next) => {
	res.render('help/contact', {
		title: 'Kontakt',
		adminFormIsActive: true,
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
				breadcrumb: [
					{
						title: res.$t('help.headline.helpSection'),
						url: '/help',
					},
				],
				release: releases.data,
			});
		});
});

router.get('/confluence/:id', (req, res, next) => {
	res.render('help/confluence', {
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help',
			},
		],
		articleId: req.params.id,
	});
});

router.get('/faq/people', (req, res, next) => {
	res.render('help/people', {
		title: res.$t('help.headline.contactDetails'),
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help',
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
				url: '/help',
			},
		],
	});
});

router.get('/faq/documents', async (req, res, next) => {
	const userRoles = res.locals.currentUser.roles.map(r => r.name);
	const isDemoUser = userRoles.some(r => r.startsWith('demo'));

	if (isDemoUser) {
		req.session.notification = {
			type: 'danger',
			message: res.$t('help.text.noAccessDemoAccount'),
		};
		return res.redirect('/help');
	}

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
		title: res.$t('help.headline.welcomeDocuments'),
		breadcrumb: [
			{
				title: res.$t('help.headline.helpSection'),
				url: '/help',
			},
		],
		sections: documents,
	});
});


module.exports = router;
