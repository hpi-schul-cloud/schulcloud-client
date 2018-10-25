const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const permissionHelper = require('../helpers/permissions');
const api = require('../api');
const showdown  = require('showdown');
const converter = new showdown.Converter();
const moment = require('moment');

const faq = require('../helpers/content/faq.json');

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
    res.render('help/faq', {});
});

router.get('/faq/sso', function (req, res, next) {
faq.ssoFAQ.map(faq => {
   faq.content = converter.makeHtml(faq.content);
});

    res.render('help/sso-faq', {
        faq: faq.ssoFAQ,
        title: "Häufig gestellte Fragen zu SSO"
    });
});

router.get('/faq/documents', function (req, res, next) {
    // check a random permission that demo users dont have to detect demo accounts
    let access = permissionHelper.userHasPermission(res.locals.currentUser, 'FEDERALSTATE_VIEW');
    
    if (access) {
        let documents = faq.documents;
        documents[0].content = converter.makeHtml(documents[0].content);
        
        res.render('help/sso-faq', {
            faq: documents,
            title: "Dokumente des Willkommensordners zum Download"
        });
    } else {
        req.session.notification = {
            type: 'danger',
            message: "Sie haben im Demo-Account keinen Zugriff auf diese Dokumente."
        };
        res.redirect('/help');
        return;
    }
});

router.get('/releases', function (req, res, next) {
    api(req).get('/releases', {qs: {$sort: '-createdAt'}})
        .then(releases => {
           res.json(releases.data[0]);
        });
});


module.exports = router;
