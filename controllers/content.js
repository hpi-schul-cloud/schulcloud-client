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

router.get('/rating/ratingrequests',function (req, res, next) {
    api(req)({ uri: `/content/ratingrequest/${res.locals.currentUser._id}` }).then(resourcesToRate => {
        return res.render('content/rating', {
            title: 'Bewerte deine Materialien',
            content : resourcesToRate
        });
    }, console.error); //TODO remove
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

//TODO X change to patch ratingrequest
router.post('/ratingrequest',function (req, res, next) {
    const rating = req.body;
    rating.isTeacherRating = res.locals.currentUser.roles.some(role => role.name === 'teacher');
    api(req).post({
        uri: '/content/ratings',
        json: rating
    });
});

module.exports = router;
