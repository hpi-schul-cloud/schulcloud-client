const _ = require('lodash');
const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');

const getSelectOptions = (req, service, query, values = []) => {
    return api(req).get('/' + service, {
        qs: query
    }).then(data => {
        return data.data;
    });
};


const markSelected = (options, values = []) => {
    return options.map(option => {
        option.selected = values.includes(option._id);
        return option;
    });
};

const editCourseHandler = (req, res, next) => {
    let coursePromise, action, method;
    if(req.params.courseId) {
        action = '/courses/' + req.params.courseId;
        method = 'patch';
        coursePromise = api(req).get('/courses/' + req.params.courseId, {
            qs: {
                $populate: ['lessonIds', 'ltiToolIds', 'classIds', 'teacherIds', 'userIds']
            }
        });
    } else {
        action = '/courses/';
        method = 'post';
        coursePromise = Promise.resolve({});
    }

    const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
    const teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher'], $limit: 1000 });
    const studentsPromise = getSelectOptions(req, 'users', {roles: ['student'], $limit: 1000 });

    Promise.all([
        coursePromise,
        classesPromise,
        teachersPromise,
        studentsPromise
    ]).then(([course, classes, teachers, students]) => {

        classes = classes.filter(c => c.schoolId == res.locals.currentSchool);
        teachers = teachers.filter(t => t.schoolId == res.locals.currentSchool);
        students = students.filter(s => s.schoolId == res.locals.currentSchool);

        // preselect current teacher when creating new course
        if (!req.params.courseId) {
            course.teacherIds = [];
            course.teacherIds.push(res.locals.currentUser);
        }

        res.render('courses/edit-course', {
            action,
            method,
            title: req.params.courseId ? 'Kurs bearbeiten' : 'Kurs anlegen',
            submitLabel: req.params.courseId ? 'Änderungen speichern' : 'Kurs anlegen',
            course,
            classes: markSelected(classes, _.map(course.classIds, '_id')),
            teachers: markSelected(teachers, _.map(course.teacherIds, '_id')),
            students: markSelected(students, _.map(course.userIds, '_id'))
        });
    });
};

// secure routes
router.use(authHelper.authChecker);


/*
 * Courses
 */


router.get('/', function (req, res, next) {
    api(req).get('/courses/', {
        qs: {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id}
            ]
        }
    }).then(courses => {
        courses = courses.data.map(course => {
            course.url = '/courses/' + course._id;
            return course;
        });
        res.render('courses/overview', {
            title: 'Meine Kurse',
            courses
        });
    });
});


router.post('/', function (req, res, next) {
    api(req).post('/courses/', {
        json: req.body // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/');
    }).catch(_ => {
        res.sendStatus(500);
    });
});


router.get('/add/', editCourseHandler);


/*
 * Single Course
 */

router.get('/:courseId/json', function (req, res, next) {
    Promise.all([
        api(req).get('/courses/' + req.params.courseId, {
            qs: {
                $populate: ['ltiToolIds']
            }
        }),
        api(req).get('/lessons/', {
            qs: {
                courseId: req.params.courseId
            }
        })
    ]).then(([course, lessons]) => res.json({course, lessons}));
});

router.get('/:courseId', function (req, res, next) {

    Promise.all([
        api(req).get('/courses/' + req.params.courseId, {
            qs: {
                $populate: ['ltiToolIds']
            }
        }),
        api(req).get('/lessons/', {
            qs: {
                courseId: req.params.courseId
            }
        })
    ]).then(([course, lessons]) => {
        let ltiToolIds = (course.ltiToolIds || []).filter(ltiTool => ltiTool.isTemplate !== 'true');
        lessons = (lessons.data || []).map(lesson => {
            return Object.assign(lesson, {
                url: '/courses/' + req.params.courseId + '/lessons/' + lesson._id + '/'
            });
        });

        res.render('courses/course', Object.assign({}, course, {
            title: course.name,
            lessons,
            ltiToolIds,
            breadcrumb: [
                {
                    title: 'Meine Kurse',
                    url: '/courses'
                },
                {}
            ]
        }));
    });
});


router.patch('/:courseId', function (req, res, next) {
    api(req).patch('/courses/' + req.params.courseId, {
        json: req.body // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/' + req.params.courseId);
    }).catch(_ => {
        res.sendStatus(500);
    });
});


router.delete('/:courseId', function (req, res, next) {
    api(req).delete('/courses/' + req.params.courseId).then(_ => {
        res.redirect('/courses/');
    }).catch(_ => {
        res.sendStatus(500);
    });
});


router.get('/:courseId/edit', editCourseHandler);


module.exports = router;
