const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {

    const query = req.query.q;
    const action = 'addToLesson';

    const itemsPerPage = (req.query.limit || 9);
    const currentPage = parseInt(req.query.p) || 1;

    // Featured Content
    if (!query) {
        return Promise.all([
            api(req)({
                uri: '/content/resources/',
                qs: {
                    featuredUntil: {
                        $gte: new Date()
                    }
                },
                json: true
            }),
            api(req)({
                uri: '/content/resources/',
                qs: {
                    $sort: {
                        clickCount: -1
                    },
                    $limit: 3
                },
                json: true
            })
        ]).then(([featured, trending]) => {

            // TODO X replace Fake dummy data for rating
            featured.data.map(function (item) {
                console.log(item);
                item.rating = Math.round(Math.random() * 100) % 50 /10;
            });
            trending.data.map(function (item) {
                item.rating = Math.round(Math.random() * 100) % 50 / 10;
            });
            return res.render('content/store', {
                title: 'Materialien',
                featuredContent: featured.data,
                trendingContent: trending.data,
                totalCount: trending.total,
                action
            });
        });
    // Search Results
    } else {
        return api(req)({
            uri: '/content/search/',
            qs: {
                _all: { $match: query },
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
            },
            json: true
        }).then(searchResults => {
            const pagination = {
                currentPage,
                numPages: Math.ceil(searchResults.total / itemsPerPage),
                baseUrl: req.baseUrl + '/?' + 'q=' + query + '&p={{page}}'
            };
            return res.render('content/search-results', {
                title: 'Materialien',
                query: query,
                searchResults: searchResults,
                pagination,
                action
            });
        });
    }
});

router.get('/:id', function (req, res, next) {
    Promise.all([
        api(req).get('/courses/', {
            qs: {
                teacherIds: res.locals.currentUser._id
            }
        }),
        api(req).get('/content/resources/' + req.params.id, {
            json: true
        })
    ]).then(([courses, content]) => {
        // Fix "client" <==> "providerName"
        content.client = content.providerName;
        // Set URL for Redirect
        content.url = '/content/redirect/' + content._id;
        res.json({
            courses: courses,
            content: content
        });
    }).catch(err => {
        next(err);
    });
});

router.get('/redirect/:id', function (req, res, next) {
    return api(req)({
        uri: req.originalUrl,
        followRedirect: false,
        resolveWithFullResponse: true,
        simple: false
    }).then(response => {
        if(response.statusCode === 302) {
            res.redirect(response.headers.location);
        } else { // handle non 5xx, e.g. 404
            next();
        }
    }).catch(err => {
        next(err);
    });
});

router.get('/rate/rating',function (req, res, next) {
    api(req)({ uri: `/content/ratingrequest/${res.locals.currentUser._id}` }).then(resourcesToRate => {
        return res.render('content/rating', {
            title: 'Bewerte deine Materialien',
            content : resourcesToRate
        });
    }, console.error);
});

router.post('/addToLesson', function (req, res, next) {
    api(req).post('/materials/', {
        json: req.body
    }).then(material => {
        api(req).patch('/lessons/' + req.body.lessonId, {
            json: {
                $push: {
                    materialIds: material._id
                }
            }
        }).then(result => {
            res.redirect('/content/?q=' + req.body.query);
        });
    });
});

router.post('/rate/:id',function (req, res, next) {
    const rating = req.body;
    rating.isTeacherRating = res.locals.currentUser.roles.some(role => role.name === 'teacher');
    // TODO X send proper courseId and topicId, send ratingrequestid as param
    rating.courseId = "0000dcfbfb5c7a3f00bf21ab";
    rating.topicId = "5a7318d67bbd9f1b32e6bc16";
    api(req).post({
        uri: '/content/ratings',
        json: rating
    });
});

module.exports = router;
