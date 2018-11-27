const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const permissionHelper = require('../helpers/permissions');
const api = require('../api');
const showdown = require('showdown');
const converter = new showdown.Converter();
const moment = require('moment');

const faq = require('../helpers/content/faq.json');

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

// read here for updateding the tutorials.json: https://docs.schul-cloud.org/display/Intern/Hilfe-Artikel+aktualisieren
const tutorials = require('../helpers/content/tutorials.json');

const firstStepsItems = [{
        title: "Schüler",
        icon: "fa-child",
        src: "/help/confluence/40304731",
        color: "#ea9d4a"
    },
    {
        title: "Lehrer",
        icon: "fa-child",
        src: "/help/confluence/40304726",
        color: "#29b24b"
    }, {
        title: "Admin",
        icon: "fa-child",
        src: "/help/confluence/40304667",
        color: "#b11e3b"
    },
    {
        title: "Schulleitung",
        icon: "fa-child",
        src: "/help/confluence/40304728",
        color: "#41bcec"
    }
];
const quickHelpItems = [{
        title: "Online-Videokurse",
        icon: "fa-video-camera",
        src: "https://mooc.house/courses/schulcloud2018"
    },
    {
        title: "MINT-EC Webinare",
        icon: "fa-desktop",
        src: "https://www.mint-ec.de/schulnetzwerk/hpi-schul-cloud/das-projekt/"
    }, {
        title: "Schnellstart-PDF",
        icon: "fa-file-pdf-o",
        src: "https://docs.schul-cloud.org/download/attachments/13828239/HPI%20Schul-Cloud%20-%20Schnellstart%20f%C3%BCr%20Lehrkr%C3%A4fte.pdf"
    }
];
const knowledgeItems = [{
        title: "Überblick",
        icon: "fa-info",
        src: "/about"
    },
    {
        title: "FAQ",
        icon: "fa-comments",
        src: "/help/confluence/23232533"
    },
    {
        title: "SSO",
        icon: "fa-sign-in",
        src: "/help/faq/sso"
    },
    {
        title: "Release Notes",
        icon: "fa-clipboard",
        src: "/help/releases"
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
    let quickhelp = quickHelpItems.slice(0);
    const isDemo = res.locals.currentUser.roles.every((role) => {
        return (role.name.includes("demo"));
    });
    const isStudent = res.locals.currentUser.roles.every((role) => {
        return (role.name === "student");
    });

    if(!isDemo && !isStudent){
        quickhelp.push({
            title: "Dokumente des Willkommensordners",
            icon: "fa-folder-open",
            src: "/help/faq/documents "
        });
    }
    res.render('help/help', {
        title: 'Hilfebereich',
        tutorials: tutorials,
        knowledgeItems: knowledgeItems,
        quickHelpItems: quickhelp,
        firstStepsItems: firstStepsItems,
        demo: isDemo
    });
});

router.get('/releases', function (req, res, next) {
    api(req).get('/releases', {
            qs: {
                $sort: '-createdAt'
            }
        })
        .then(releases => {
            releases.data.map(release => {
                release.body = converter.makeHtml(release.body);
                release.publishedAt = moment(release.publishedAt).format('ddd, ll');
            });

            res.render('help/releases', {
                title: 'Releases',
                breadcrumb: [
                    {
                        title: 'Hilfebereich',
                        url: '/help'
                    }
                ],
                release: releases.data
            });
        });
});

router.get('/confluence/:id', function (req, res, next) {
    res.render('help/confluence', {
        breadcrumb: [
            {
                title: 'Hilfebereich',
                url: '/help'
            }
        ],
        articleId: req.params.id
    });
});

router.get('/faq/sso', function (req, res, next) {
    faq.ssoFAQ.map(faq => {
        faq.content = converter.makeHtml(faq.content);
    });

    res.render('help/sso-faq', {
        title: "Häufig gestellte Fragen zu SSO",
        breadcrumb: [
            {
                title: 'Hilfebereich',
                url: '/help'
            },
        ],
        faq: faq.ssoFAQ
    });
});

router.get('/faq/documents', function (req, res, next) {
    // check a random permission that demo users dont have to detect demo accounts
    let access = permissionHelper.userHasPermission(res.locals.currentUser, 'FEDERALSTATE_VIEW');

    if (access) {
        let documents = faq.documents;
        documents[0].content = converter.makeHtml(documents[0].content);

        res.render('help/sso-faq', {
            title: "Dokumente des Willkommensordners zum Download",
            breadcrumb: [
                {
                    title: 'Hilfebereich',
                    url: '/help'
                },
            ],
            faq: documents
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


module.exports = router;