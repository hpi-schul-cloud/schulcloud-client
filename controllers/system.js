const express = require('express');
const moment = require('moment');
const { Converter } = require('showdown');
const authHelper = require('../helpers/authentication');
const api = require('../api');

const router = express.Router();
const converter = new Converter();

// secure routes
router.use(authHelper.authChecker);

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

			res.render('system/releases', {
				breadcrumb: [
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

module.exports = router;
