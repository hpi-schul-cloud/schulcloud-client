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

const RSSParser = require('rss-parser')
const rssParser = new RSSParser()

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

function createNewsEntry(item, currentUser) {
    item.date = moment(item.createdAt)
    item.url = '/news/' + item._id
    item.secondaryTitle = moment(item.displayAt).fromNow()
    item.background = '#' + COLORS[(item.title || "").length % COLORS.length]
    if (currentUser.permissions.includes('SCHOOL_NEWS_EDIT')) {
        item.actions = getActions(item, '/news/')
    }
    return item
}

router.all('/', function (req, res, next) {

    api(req).get('/schools/' + res.locals.currentSchool)
    .then(response => response.feeds || [])
    .then(async feeds => {
        let arr = []
        for (let i = 0; i < feeds.length; i++) {
            try {
                const feed = await rssParser.parseURL(feeds[i].source)
                arr = arr.concat(feed.items.map(item => ({
                    date: moment(item.isoDate),
                    title: item.title,
                    content: item.contentSnippet,
                    url: `/news/feeds/${encodeURIComponent(item.guid)}`,
                    secondaryTitle: moment(item.pubDate).fromNow(),
                    background: '#' + COLORS[(item.title || "").length % COLORS.length],
                    tag: feeds[i].tag
                })))
            } catch (err) {
                throw new Error(`RSS Feed ${feeds[i].source} konnte nicht verarbeitet werden.`)
            }
        }
        return arr
    })
    .then(async items=>{
        if(items.length){
            const news = await api(req).get('/news/')
            items = items.concat(news.data.map(item => createNewsEntry(item, res.locals.currentUser)))
            items.sort((a, b) => a.date.isAfter(b.date) ? -1 : a.date.isBefore(b.date) ? 1 : 0)
            res.render('news/overview', {
                title: 'Neuigkeiten aus meiner Schule',
                news: items,
                searchLabel: 'Suche nach Neuigkeiten',
                searchAction: '/news/',
                showSearch: true,
            })
        }else{
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

            const news = await api(req).get('/news/', { qs: queryObject })
            items = items.concat(news.data.map(item => createNewsEntry(item, res.locals.currentUser)))
            items.sort((a, b) => a.date.isAfter(b.date) ? -1 : a.date.isBefore(b.date) ? 1 : 0)

            res.render('news/overview', {
                title: 'Neuigkeiten aus meiner Schule',
                news: items,
                pagination: {
                    currentPage,
                    numPages: Math.ceil(news.total / itemsPerPage),
                    baseUrl: '/news/?p={{page}}'
                },
                searchLabel: 'Suche nach Neuigkeiten',
                searchAction: '/news/',
                showSearch: true,
            })
        }
    })
    .catch(err=>next(err))
})

router.get('/feeds/:id', async (req,res,next)=>{

    api(req).get('/schools/' + res.locals.currentSchool)
    .then(response=>response.feeds)
    .then(async feeds=>{
        const arr = []
        for (let i = 0; i < feeds.length; i++) {
            const feed = await rssParser.parseURL(feeds[i].source)
            arr.push(...feed.items)
        }
        const ret = arr.find(feed => feed.guid === req.params.id)
        if (!ret) {
            throw new Error("Feed not found")
        }
        res.render('news/feed', {
            feed: ret
        })
    })
    .catch(err=>next(err))
})

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