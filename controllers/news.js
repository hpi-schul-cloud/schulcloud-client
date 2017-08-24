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
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

router.post('/', function(req, res, next){
    if(req.body.displayAt) {
        // rewrite german format to ISO
        req.body.displayAt = moment(req.body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();
    }
    req.body.creatorId = res.locals.currentUser._id;
    req.body.lastUpdaterId = res.locals.currentUser._id;
    api(req).post('/news/', {
        // TODO: sanitize
        json: req.body
    }).then(data => {
        res.redirect('/news');
    }).catch(err => {
        next(err);
    });
});
router.patch('/:id', function(req, res, next){
    req.body.displayAt = moment(req.body.displayAt, 'DD.MM.YYYY HH:mm').toISOString();
    req.body.lastUpdaterId = res.locals.currentUser._id;
    api(req).patch('/news/' + req.params.id, {
        // TODO: sanitize
        json: req.body
    }).then(data => {
        res.redirect('/news');
    }).catch(err => {
        next(err);
    });
});
router.delete('/:id', getDeleteHandler('news'));

router.all('/', function (req, res, next) {
    const itemsPerPage = 9;
    const currentPage = parseInt(req.query.p) || 1;
    //console.log(res.locals.currentUser.permissions);
    //Somehow $lte doesn't work in normal query so I manually put it into a request
    const newsPromise = api(req).get('/news?schoolId=' + res.locals.currentSchool + '&displayAt[$lte]=' + new Date().getTime() + '&$limit='+itemsPerPage+'&$skip='+(itemsPerPage * (currentPage - 1))+'&$sort=-displayAt'
    ).then(news => {
        const totalNews = news.total;
        news = news.data.map(news => {
            news.url = '/news/' + news._id;
            news.date = moment(news.displayAt).fromNow();
            news.actions = getActions(news, '/news/');
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
        closeLabel: 'Schließen',
        method: 'post',
        action: '/news/',
    });
});

router.get('/:newsId', function (req, res, next) {
    api(req).get('/news/'+req.params.newsId, {
        $populate: ['creatorId', 'lastUpdaterId']
    }).then(news => {
        news.url = '/news/' + news._id;
        res.render('news/article', {title: news.title, news});
    });
});

router.get('/:newsId/edit', function (req, res, next) {
    api(req).get('/news/'+req.params.newsId, {
    }).then(news => {
        news.displayAt = moment(news.displayAt).format('DD.MM.YYYY HH:mm');
        res.render('news/edit', {
            title: "News bearbeiten", 
            submitLabel: 'Speichern',
            closeLabel: 'Schließen',
            method: 'patch',
            action: '/news/'+req.params.newsId,
            news
        });
    });
});

module.exports = router;
