const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const showdown  = require('showdown');
const converter = new showdown.Converter();
const moment = require('moment');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    api(req).get('/releases', {qs: {$sort: '-createdAt'}})
        .then(releases => {
            releases.data.map(release => {
                release.body = converter.makeHtml(release.body);
                release.publishedAt = moment(release.publishedAt).format('ddd, ll');
            });

            res.render('help/help', {
                title: 'Hilfebereich',
                release: releases.data
            });
        });
});

router.get('/faq', function (req, res, next) {
   res.render('help/faq', {

   });
});

router.get('/releases', function (req, res, next) {
    api(req).get('/releases', {qs: {$sort: '-createdAt'}})
        .then(releases => {
           res.json(releases.data[0]);
        });
});


module.exports = router;
