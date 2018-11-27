const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

const contentFilterSettings = function() {
    return [
        {
            type: "sort",
            title: 'Sortierung',
            displayTemplate: 'Sortieren nach: %1',
            options: [
                ["updatedAt", "Aktualität"],
                ["providerName", "Anbieter"],
                ["clickCount", "Beliebtheit"]
            ],
            defaultOrder: "DESC"
        },
        {
            type: "limit",
            title: 'Einträge pro Seite',
            displayTemplate: 'Einträge pro Seite: %1',
            options: [9, 18, 24, 48, 99],
            defaultSelection: 9
        },
        {
            type: "select",
            title: 'Dateityp',
            displayTemplate: 'Dateitypen: %1',
            property: 'mimeType',
            multiple: true,
            expanded: true,
            options: [
                ["text/html", "Text"],
                ["video", "Video"]
            ]
        },
    ];
};

router.get('/', function (req, res, next) {
    return res.render('content/search');
});

router.get('/my-content', function (req, res, next) {
    return res.render('content/my-content');
});

router.get('/create', function (req, res, next) {
    return res.render('content/create');
});

router.get('/edit/:id', function (req, res, next) {
    return res.render('content/create');
});

router.get('/view/:id', function (req, res, next) {
    return res.render('content/edit');
});

router.get('/review/:id', function (req, res, next) {
    return res.render('content/review-content');
});


router.get('/review', function (req, res, next) {
    return res.render('content/review');
});

router.get('/search', function (req, res, next) {
    return res.render('content/search');
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
        uri: '/content/redirect/' + req.params.id,
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

router.post('/addToLesson', function (req, res, next) {
    console.log("In /addToLesson of client content controller");
    console.log(req.body);
    api(req).post('/materials/', {
        json: req.body
    }).then(material => {
        console.log("after post call to /materials");
        console.log(material);
        api(req).patch('/lessons/' + req.body.lessonId, {
            json: {
                courseId: req.body.courseId,
                $push: {
                    materialIds: material._id
                }
            }
        }).then(result => {
            console.log("Successfully patches lesson");
            res.redirect('/content/?q=' + req.body.query);
        });
    });
});

// router.post('/publish', function (req, res, next) {
//     api(req).post('/content/resources/', {
//         json: req.body
//     }).then(response => {
//       console.log("Inside response of publish call");
//       console.log(response);
//     }).then(result => {
//             res.redirect('/content/?q=' + req.body.query);
//     });
// });
//
// router.post('/rate', function (req, res, next) {
//     console.log("In rate call with body: ", req.body);
//     api(req).patch('/content/resources/' + req.body.id, {
//         json: req.body
//     }).then(response => {
//       console.log("Inside response of publish call");
//       console.log(response);
//     }).then(result => {
//             res.redirect('/content/?q=' + req.body.query);
//     });
// });

module.exports = router;
