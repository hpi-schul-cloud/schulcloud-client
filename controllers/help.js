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

/*

// GET tutorials.json

async function articles(){
    const cardsUrl = `https://docs.schul-cloud.org/rest/api/content/13828239/child/page?expand=children.page`;
    const cardsResult = await fetch(cardsUrl);
    const cardJson = await cardsResult.json();
    let cards = cardJson.results.map((category) => {
        return {
            id: category.id,
            title: category.title,
            type: "topic"
        };
    }).map(async (card) => {
        const articleResult = await fetch(`https://docs.schul-cloud.org/rest/api/content/${card.id}/child/page?expand=children.page`);
        const articleJson = await articleResult.json();
        let categories = articleJson.results.map((category) => {
            return {
                id: category.id,
                title: category.title,
                type: "category",
                articles: category.children.page.results.map((article) => {
                    return {
                        id: article.id,
                        title: article.title,
                        type: "article"
                    };
                })
            };
        });
        card.categories = categories;
        return card;
    });
    let content = await Promise.all(cards);
    let w = window.open();
    w.document.write(JSON.stringify(content));
}
articles();
*/
const tutorials = require('../helpers/content/tutorials.json');
const firstStepsItems = [
    {
        title: "Schüler",
        icon: "fa-child",
        src: "#"
    },
    {
        title: "Lehrer",
        icon: "fa-child",
        src: "#"
    },{
        title: "Admin",
        icon: "fa-child",
        src: "#"
    },
    {
        title: "Schulleitung",
        icon: "fa-child",
        src: "#"
    }
];
const quickHelpItems = [
    {
        title: "Online-Videokurse",
        icon: "fa-video-camera",
        src: "#"
    },
    {
        title: "MINT-EC Webinare",
        icon: "fa-desktop",
        src: "#"
    },{
        title: "Schnellstart PDF",
        icon: "fa-file-pdf-o",
        src: "#"
    }
];
const knowledgeItems =  [
    {
        title: "Überblick",
        icon: "fa-info",
        src: "#"
    },
    {
        title: "FAQ",
        icon: "fa-comments",
        src: "#"
    },
    {
        title: "SSO",
        icon: "fa-sign-in",
        src: "#"
    },
    {
        title: "Release Notes",
        icon: "fa-clipboard",
        src: "#"
    },
    {
        title: "Website",
        icon: "fa-globe",
        src: "/logout"
    }
];

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
                release: releases.data,
                tutorials: tutorials,
                knowledgeItems: knowledgeItems,
                quickHelpItems: quickHelpItems,
                firstStepsItems: firstStepsItems
            });
        });
});

router.get('/releases', function (req, res, next) {
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

router.get('/confluence/:id', function (req, res, next) {
    res.render('help/confluence', {
        articleId: req.params.id
    });
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
