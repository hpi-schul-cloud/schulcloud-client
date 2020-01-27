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

router.get('/', (req, res, next) => {
	res.render('help/help', {
		title: 'Hilfebereich',
		tutorials,
		adminFormIsActive: req.query.activeForm === 'admin',
		teamFormIsActive: req.query.activeForm === 'team',
		formAttachmentsSize: (MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE / 1024 / 1024),
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
						title: 'Hilfebereich',
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
				title: 'Hilfebereich',
				url: '/help',
			},
		],
		articleId: req.params.id,
	});
});

router.get('/faq/people', (req, res, next) => {
	res.render('help/people', {
		title: 'Ansprechpartner und Kontaktdaten',
		breadcrumb: [
			{
				title: 'Hilfebereich',
				url: '/help',
			},
		],
	});
});

router.get('/lernNuggets', (req, res, next) => {
	res.render('help/lern-nuggets', {
		title: 'Lern-Nuggets',
		breadcrumb: [
			{
				title: 'Hilfebereich',
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
			message: 'Sie haben im Demo-Account keinen Zugriff auf diese Dokumente.',
		};
		return res.redirect('/help');
	}

	const documents = await api(req)
		.get('/help/documents/', { qs: { theme: res.locals.theme.name } })
		.catch(() => {
			req.session.notification = {
				type: 'danger',
				message: 'Es existieren womöglich keine Willkommensdokumente. Bitte wende dich an den User-Support.',
			};
			return res.redirect('/help');
		});

	return res.render('help/accordion-sections', {
		title: 'Willkommens-Dokumente zum Download',
		breadcrumb: [
			{
				title: 'Hilfebereich',
				url: '/help',
			},
		],
		sections: documents,
	});
});


module.exports = router;
