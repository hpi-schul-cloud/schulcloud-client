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
    api(req).get('/news/', {
        query: {
            schoolId: res.locals.currentSchool
        }
    }).then(news => {
        news = news.data.map(news => {
            news.url = '/news/' + news._id;
            news.timeString = moment(news.displayAt).fromNow();
            return news;
        });
        function sortFunction(a, b) {
            if (a.displayAt === b.displayAt) {
                return 0;
            } else {
                return (a.displayAt < b.displayAt) ? 1 : -1;
            }
        }
        news = news.sort(sortFunction);
        res.render('news/overview', {title: 'News', news});
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
