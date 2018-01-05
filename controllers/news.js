/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const handlebars = require("handlebars");
const moment = require("moment");
moment.locale('de');

router.use(authHelper.authChecker);

const getActions = (item, path) => {
    return [
        {
            link: path + item._id + "/edit",
            class: 'btn-edit',
            icon: 'edit',
            alt: 'bearbeiten'
        },
        {
            link: path + item._id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete',
            alt: 'löschen'
        }
    ];
};

const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.sendStatus(200);
        }).catch(err => {
            next(err);
        });
    };
};

router.post('/', function (req, res, next) {
    if (req.body.displayAt && req.body.displayAt != "__.__.____ __:__") { // rewrite german format to ISO
        req.body.displayAt = moment(req.body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();
    } else {
        req.body.displayAt = undefined;
    }
    req.body.creatorId = res.locals.currentUser._id;
    req.body.createdAt = moment().toISOString();

    api(req).post('/news/', {
        // TODO: sanitize
        json: req.body
    }).then(data => {
        res.redirect('/news');
    }).catch(err => {
        next(err);
    });
});
router.patch('/:newsId', function (req, res, next) {
    api(req).get('/news/' + req.params.newsId, {}).then(orgNews => {
        req.body.displayAt = moment(req.body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();

        const historyEntry = {
            "title": orgNews.title,
            "content": orgNews.content,
            "displayAt": orgNews.displayAt,

            "creatorId": (orgNews.updaterId) ? (orgNews.updaterId) : (orgNews.creatorId),
            "parentId": req.params.newsId
        };

        api(req).post('/newshistory/', {
            // TODO: sanitize
            json: historyEntry
        }).then(data => {
            req.body.updaterId = res.locals.currentUser._id;
            req.body.updatedAt = moment().toISOString();
            orgNews.history.push(data._id);
            req.body.history = orgNews.history;

            api(req).patch('/news/' + req.params.newsId, {
                // TODO: sanitize
                json: req.body
            }).then(data => {
                res.redirect('/news');
            }).catch(err => {
                next(err);
            });


        }).catch(err => {
            next(err);
        });
    });
});
router.delete('/:id', getDeleteHandler('news'));

router.all('/', function (req, res, next) {
    const itemsPerPage = 9;
    const currentPage = parseInt(req.query.p) || 1;
    //Somehow $lte doesn't work in normal query so I manually put it into a request
    let requestUrl = '/news?$limit=' + itemsPerPage +
        ((res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT')) ? '' : ('&displayAt[$lte]=' + new Date().getTime())) +
        '&$skip=' + (itemsPerPage * (currentPage - 1)) +
        '&$sort=-displayAt';
    const newsPromise = api(req).get(requestUrl).then(news => {
        const totalNews = news.total;
        const colors = ["F44336","E91E63","3F51B5","2196F3","03A9F4","00BCD4","009688","4CAF50","CDDC39","FFC107","FF9800","FF5722"];
        news = news.data.map(news => {
            news.url = '/news/' + news._id;
            news.secondaryTitle = moment(news.displayAt).fromNow();
            news.background = '#'+colors[(news.title||"").length % colors.length];
            if (res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT')) {
                news.actions = getActions(news, '/news/');
            }
            return news;
        });
        const pagination = {
            currentPage,
            numPages: Math.ceil(totalNews / itemsPerPage),
            baseUrl: '/news/?p={{page}}'
        };
        res.render('news/overview', {
            title: 'Neuigkeiten',
            news,
            pagination,
        });
    });
});

router.get('/new', function (req, res, next) {
    res.render('news/edit', {
        title: "News erstellen",
        submitLabel: 'Hinzufügen',
        closeLabel: 'Abbrechen',
        method: 'post',
        action: '/news/',
    });
});

router.get('/:newsId', function (req, res, next) {
    api(req).get('/news/' + req.params.newsId, {
        qs: {
            $populate: ['creatorId', 'updaterId']
        }
    }).then(news => {
        news.url = '/news/' + news._id;
        res.render('news/article', {title: news.title, news});
    });
});

router.get('/:newsId/edit', function (req, res, next) {
    api(req).get('/news/' + req.params.newsId, {}).then(news => {
        news.displayAt = moment(news.displayAt).format('DD.MM.YYYY HH:mm');
        res.render('news/edit', {
            title: "News bearbeiten",
            submitLabel: 'Speichern',
            closeLabel: 'Abbrechen',
            method: 'patch',
            action: '/news/' + req.params.newsId,
            news
        });
    });
});

module.exports = router;
