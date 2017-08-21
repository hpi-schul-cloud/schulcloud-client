const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const api = require('../api');
const rp = require('request-promise');

const contentUrl = process.env.CONTENT_URL || 'http://localhost:4040/';

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    const query = req.query.q;
    const action = 'addToLesson';
    // Featured Content
    if (!query) {
        return rp({
            uri: contentUrl + 'featured',
            json: true
        }).then(featured => {
            return res.render('content/store', {
                title: 'Materialien',
                featuredContent: featured.data,
                action
            });
        });
    // Search Results
    } else {
        return rp({
            uri: contentUrl + 'search',
            qs: { q: query },
            json: true
        }).then(results => {
            // Include _id field in _source
            const searchResults = results.hits.hits.map(x => {
                x._source._id = x._id;
                return x;
            });
            return res.render('content/search-results', {
                title: 'Materialien',
                query: query,
                searchResults: searchResults,
                action
            });
        });
    }
});

router.get('/:id', function (req, res, next) {
    Promise.all([
        api(req).get('/courses/', {
            qs: {
                teacherIds: res.locals.currentUser._id}
        }),
        rp({
            uri: contentUrl + 'content/' + req.params.id,
            json: true
        })
    ]).
    then(([courses, content]) => {
        // Fix "client" <==> "providerName"
        content.client = content.providerName;
        res.json({
            courses: courses,
            content: content
        });
    }).catch(err => {
        next(err);
    });
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

module.exports = router;
