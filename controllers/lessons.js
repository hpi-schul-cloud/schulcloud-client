const _ = require('lodash');
const moment = require('moment');
const express = require('express');
const router = express.Router({ mergeParams: true });
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');


const editLessonHandler = (req, res, next) => {
    let lessonPromise, action, method;
    if(req.params.lessonId) {
        action = '/courses/' + req.params.courseId + '/lessons/' + req.params.lessonId;
        method = 'patch';
        lessonPromise = api(req).get('/lessons/' + req.params.lessonId);
    } else {
        action = '/courses/' + req.params.courseId + '/lessons/';
        method = 'post';
        lessonPromise = Promise.resolve({});
    }

    Promise.all([
        lessonPromise
    ]).then(([lesson]) => {

        lesson.time = moment(lesson.time || 0).format('HH:mm');
        lesson.date = moment(lesson.date || 0).format('YYYY-MM-DD');

        res.render('courses/edit-lesson', {
            action,
            method,
            title: req.params.courseId ? 'Unterrichtsstunde bearbeiten' : 'Unterrichtsstunde anlegen',
            submitLabel: req.params.courseId ? 'Änderungen speichern' : 'Unterrichtsstunde anlegen',
            lesson,
            courseId: req.params.courseId
        });
    });
};


// secure routes
router.use(authHelper.authChecker);


router.get('/', (req, res, next) => {
    res.redirect('/courses/' + req.params.courseId);
});


router.get('/add', editLessonHandler);


router.post('/', function (req, res, next) {
    const data = req.body;

    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    api(req).post('/lessons/', {
        json: data // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/' + req.params.courseId + '/lessons/');
    }).catch(_ => {
        res.sendStatus(500);
    });
});


router.get('/:lessonId', function (req, res, next) {

    Promise.all([
        api(req).get('/courses/' + req.params.courseId),
        api(req).get('/lessons/' + req.params.lessonId, {
            qs: {
                $populate: ['materialIds']
            }
        })
    ]).then(([course, lesson]) => {
        // decorate contents
        lesson.contents = (lesson.contents || []).map(block => {
            return Object.assign(block, {
                component: 'courses/components/content-text',
                markup: marked(block.content || '')
            });
        });

        res.render('courses/lesson', Object.assign({}, lesson, {
            title: lesson.name,
            breadcrumb: [
                {
                    title: 'Meine Kurse',
                    url: '/courses'
                },
                {
                    title: course.name,
                    url: '/courses/' + course._id
                },
                {}
            ]
        }));
    });
});


router.patch('/:lessonId', function (req, res, next) {
    const data = req.body;

    data.time = moment(data.time || 0, 'HH:mm').toString();
    data.date = moment(data.date || 0, 'YYYY-MM-DD').toString();

    api(req).patch('/lessons/' + req.params.lessonId, {
        json: data // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/' + req.params.courseId + '/lessons/' + req.params.lessonId);
    }).catch(_ => {
        res.sendStatus(500);
    });
});


router.delete('/:lessonId', function (req, res, next) {
    api(req).delete('/lessons/' + req.params.lessonId).then(_ => {
        res.redirect('/courses/' + req.params.courseId + '/lessons/');
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.delete('/:lessonId/materials/:materialId', function (req, res, next) {
    api(req).patch('/lessons/' + req.params.lessonId, {
        json: {
            $pull: {
                materialIds: req.params.materialId
            }
        }
    }).then(_ => {
        api(req).delete('/materials/' + req.params.materialId).then(_ => {
            res.sendStatus(200);
        });
    });
});


router.get('/:lessonId/edit', editLessonHandler);


module.exports = router;
