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
moment.locale('de')

router.use(authHelper.authChecker);

const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(
            data => {
            res.json(data);
    }).catch(err => {
            next(err);
    });
    };
};

router.get('/:id/json', getDetailHandler('news'));

router.all('/', function (req, res, next) {
    const itemsPerPage = 9;
    const currentPage = parseInt(req.query.p) || 1;
    //Somehow $lte doesn't work in normal query so I manually put it into a request
    const newsPromise = api(req).get('/news?schoolId=' + res.locals.currentSchool + '&displayAt[$lte]=' + new Date().getTime() + '&$limit='+itemsPerPage+'&$skip='+(itemsPerPage * (currentPage - 1))+'&$sort=-displayAt'
    ).then(news => {
        const totalNews = news.total;
        news = news.data.map(news => {
            news.url = '/news/' + news._id;
            news.date = moment(news.displayAt).fromNow();
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
            pagination
        });
    });
});

router.get('/:newsId', function (req, res, next) {
    api(req).get('/news/'+req.params.newsId, {
    }).then(news => {
        news.url = '/news/' + news._id;
        news.timeString = moment(news.displayAt).fromNow();
        res.render('news/newsEntry', {title: news.title, news});
    });
});

module.exports = router;
