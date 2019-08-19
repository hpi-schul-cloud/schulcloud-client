const express = require('express');
const showdown = require('showdown');
const moment = require('moment');
const authHelper = require('../helpers/authentication');
const permissionHelper = require('../helpers/permissions');
const api = require('../api');
const faq = require('../helpers/content/faq.json');

const router = express.Router();
const converter = new showdown.Converter();

// read here for updateding the tutorials.json: https://docs.schul-cloud.org/display/Intern/Hilfe-Artikel+aktualisieren
const tutorials = require('../helpers/content/tutorials.json');

const firstStepsItems = [{
	title: 'Schüler',
	'img-src': '/images/help/schueler-icon.png',
	src: '/help/confluence/40304731',
}, {
	title: 'Lehrer',
	'img-src': '/images/help/lehrer-icon.png',
	src: '/help/confluence/40304726',
}, {
	title: 'Admin',
	'img-src': '/images/help/admin-icon.png',
	src: '/help/confluence/40304667',
}, {
	title: 'Schulleitung',
	'img-src': '/images/help/schulleitung-icon.png',
	src: '/help/confluence/40304728',
},
];
const quickHelpItems = [{
	title: 'Online-Videokurse',
	icon: 'fa-video-camera',
	src: 'https://mooc.house/courses/schulcloud2019',
}, {
	title: 'Webinare',
	icon: 'fa-desktop',
	src: 'https://docs.schul-cloud.org/display/SCDOK/Webinare',
}, {
	title: 'Schnellstart-PDF',
	icon: 'fa-file-pdf-o',
	// eslint-disable-next-line max-len
	src: 'https://docs.schul-cloud.org/download/attachments/13828239/HPI%20Schul-Cloud%20-%20Schnellstart%20f%C3%BCr%20Lehrkr%C3%A4fte.pdf',
},
];
const knowledgeItems = [{
	title: 'Überblick',
	icon: 'fa-info',
	src: '/about',
}, {
	title: 'FAQ',
	icon: 'fa-comments',
	src: '/help/confluence/23232533',
}, {
	title: 'Ansprechpartner',
	icon: 'fa-user',
	src: '/help/faq/people',
}, {
	title: 'Release Notes',
	icon: 'fa-clipboard',
	src: '/help/releases',
}, {
	title: 'Website (Logout)',
	icon: 'fa-globe',
	src: '/logout',
},
];

// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	const isDemo = res.locals.currentUser.roles.every(role => role.name.includes('demo'));
	const isStudent = res.locals.currentUser.roles.every(role => role.name === 'student');

	const quickhelp = quickHelpItems.slice(0);
	if (!isDemo && !isStudent) {
		quickhelp.push({
			title: 'Willkommens-Dokumente',
			icon: 'fa-folder-open',
			src: '/help/faq/documents ',
		});
	}
	res.render('help/help', {
		title: 'Hilfebereich',
		tutorials,
		knowledgeItems,
		quickHelpItems: quickhelp,
		firstStepsItems,
		demo: isDemo,
		adminFormIsActive: req.query.activeForm === 'admin',
		teamFormIsActive: req.query.activeForm === 'team',
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
				title: 'Releases',
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
	// eslint-disable-next-line array-callback-return
	faq.people.map((ffaq) => {
		ffaq.content = converter.makeHtml(ffaq.content);
	});

	res.render('help/accordion-faq', {
		title: 'Ansprechpartner und Kontaktdaten',
		breadcrumb: [
			{
				title: 'Hilfebereich',
				url: '/help',
			},
		],
		faq: faq.people,
	});
});

router.get('/faq/documents', (req, res, next) => {
	// check a random permission that demo users dont have to detect demo accounts
	const access = permissionHelper.userHasPermission(res.locals.currentUser, 'FEDERALSTATE_VIEW');

	if (access) {
		const { documents } = faq;
		documents[0].content = converter.makeHtml(documents[0].content);

		res.render('help/accordion-faq', {
			title: 'Willkommens-Dokumente zum Download',
			breadcrumb: [
				{
					title: 'Hilfebereich',
					url: '/help',
				},
			],
			faq: documents,
		});
	} else {
		req.session.notification = {
			type: 'danger',
			message: 'Sie haben im Demo-Account keinen Zugriff auf diese Dokumente.',
		};
		res.redirect('/help');
	}
});


module.exports = router;
