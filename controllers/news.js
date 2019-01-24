/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const handlebars = require("handlebars");
const feed = require("feed-read")
const moment = require("moment");
moment.locale('de');

const COLORS = ["F44336", "E91E63", "3F51B5", "2196F3", "03A9F4", "00BCD4", "009688", "4CAF50", "CDDC39", "FFC107", "FF9800", "FF5722"];

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
    }).catch(err => {
        next(err);
    });
});
router.delete('/:id', getDeleteHandler('news'));

const readSchoolFeeds = src => {
    return new Promise((resolve, reject) => {
        feed(src, (err, rss) => {
            if (err) {
                reject(new Error(`RSS Feed ${src} konnte nicht verarbeitet werden.`))
            } else {
                resolve(rss.map(item => ({
                    date: moment(item.published),
                    title: item.title,
                    url: item.link,
                    secondaryTitle: moment(item.published).fromNow(),
                    background: '#' + COLORS[(item.title || "").length % COLORS.length],
                    external: true
                })))
            }
        })
    }) 
}

router.all('/', async function (req, res, next) {
    const query = req.query.q;
    const itemsPerPage = 9;
    const currentPage = parseInt(req.query.p) || 1;

    let queryObject = {
        $limit: itemsPerPage,
        displayAt: (res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT')) ? {} : { $lte: new Date().getTime() },
        $skip: (itemsPerPage * (currentPage - 1)),
        $sort: '-displayAt',
        title: { $regex: query, $options: 'i' }
    };

    if (!query) delete queryObject.title;

    try {

        const newsData = await api(req).get('/news/', { qs: queryObject })

        let news = newsData.data.map(item => {
            item.date = moment(item.createdAt)
            item.url = '/news/' + item._id;
            item.secondaryTitle = moment(item.displayAt).fromNow();
            item.background = '#' + COLORS[(item.title || "").length % COLORS.length];
            item.external = false
            if (res.locals.currentUser.permissions.includes('SCHOOL_NEWS_EDIT')) {
                item.actions = getActions(item, '/news/');
            }
            return item;
        })

        const schoolData = await api(req).get('/schools/' + res.locals.currentSchool)
        const schoolFeeds = schoolData.feeds

        for (let i = 0; i < schoolFeeds.length; i++) {
            const feed = await readSchoolFeeds(schoolFeeds[i])
            news = news.concat(feed)
        }

        news.sort((a, b) => a.date.isAfter(b.date) ? -1 : a.date.isBefore(b.date) ? 1 : 0)

        const totalNews = news.length;
        const pagination = {
            currentPage,
            numPages: Math.ceil(totalNews / itemsPerPage),
            baseUrl: '/news/?p={{page}}'
        };
        res.render('news/overview', {
            title: 'Neuigkeiten aus meiner Schule',
            news,
            pagination,
            searchLabel: 'Suche nach Neuigkeiten',
            searchAction: '/news/',
            showSearch: true,
        })

    } catch (err) {
        next(err)
    }

});

router.get('/new', function (req, res, next) {
    res.render('news/edit', {
        title: "News erstellen",
        submitLabel: 'Hinzufügen',
        closeLabel: 'Abbrechen',
        method: 'post',
        action: '/news/'
    });
});

router.get('/:newsId', function (req, res, next) {
    api(req).get('/news/' + req.params.newsId, {
        qs: {
            $populate: ['creatorId', 'updaterId']
        }
    }).then(news => {
        news.url = '/news/' + news._id;
        res.render('news/article', {title: news.title, news });
    }).catch(err => {
        next(err);
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
    }).catch(err => {
        next(err);
    });
});

module.exports = router;