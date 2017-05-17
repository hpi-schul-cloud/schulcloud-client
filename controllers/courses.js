const _ = require('lodash');
const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const recurringEventsHelper = require('../helpers/recurringEvents');
const moment = require('moment');

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

/**
 * creates an event for a created course. following params has to be included in @param course for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 0 to 6, the weekday the course take place
 * @param course
 */
const createEventsForCourse = (req, res, course) => {
    // can just run if a calendar service is running on the environment
    if (process.env.CALENDAR_SERVICE_ENABLED) {
        return Promise.all(course.times.map(time => {
            return api(req).post("/calendar", { json: {
                summary: course.name,
                location: res.locals.currentSchoolData.name,
                description: course.description,
                startDate: new Date(new Date(course.startDate).getTime() + time.startTime).toISOString(),
                duration: time.duration,
                repeat_until: course.untilDate,
                frequency: "WEEKLY",
                weekday: recurringEventsHelper.getIsoWeekdayForNumber(time.weekday),
                scopeId: course._id,
                courseId: course._id,
                courseTimeId: time._id
            }
            });
        }));
    }

    return Promise.resolve(true);
};

/**
 * Deletes all events from the given course, clear function
 * @param courseId {string} - the id of the course the events will be deleted
 */
const deleteEventsForCourse = (req, res, courseId) => {
    if (process.env.CALENDAR_SERVICE_ENABLED) {
        return api(req).get('courses/' + courseId).then(course => {
           return Promise.all((course.times || []).map(t => {
               if (t.eventId) {
                   return api(req).delete('calendar/' + t.eventId);
               }
           }));
        });
    }
    return Promise.resolve(true);
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

        // map course times to fit into UI
        (course.times || []).forEach((time, count) => {
            time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday);
            time.duration = time.duration / 1000 / 60;
            const duration = moment.duration(time.startTime);
            time.startTime = ("00" + duration.hours()).slice(-2) + ':' + ("00" + duration.minutes()).slice(-2);
            time.count = count;
        });

        // format course start end until date
        if (course.startDate) {
            course.startDate = moment(new Date(course.startDate).getTime()).format("DD.MM.YYYY");
            course.untilDate = moment(new Date(course.untilDate).getTime()).format("DD.MM.YYYY");
        }

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
            (course.times || []).forEach(time => {
                time.startTime = moment(time.startTime, "x").format("HH:mm");
                time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday);
            });
            return course;
        });
        res.render('courses/overview', {
            title: 'Meine Kurse',
            courses
        });
    });
});


router.post('/', function (req, res, next) {

    // map course times to fit model
    (req.body.times || []).forEach(time => {
        time.weekday = recurringEventsHelper.getNumberForWeekday(time.weekday);
        time.startTime = moment.duration(time.startTime, "HH:mm").asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    api(req).post('/courses/', {
        json: req.body // TODO: sanitize
    }).then(course => {
        createEventsForCourse(req, res, course).then(_ => {
            res.redirect('/courses');
        });
    }).catch(err => {
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
                url: '/courses/' + req.params.courseId + '/topics/' + lesson._id + '/'
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
    // map course times to fit model
    req.body.times = req.body.times || [];
    req.body.times.forEach(time => {
        time.weekday = recurringEventsHelper.getNumberForWeekday(time.weekday);
        time.startTime = moment.duration(time.startTime).asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
    req.body.untilDate = moment(req.body.untilDate, 'DD.MM.YYYY').format('YYYY-MM-DD');

    // first delete all old events for the course
    deleteEventsForCourse(req, res, req.params.courseId).then(_ => {
        api(req).patch('/courses/' + req.params.courseId, {
            json: req.body // TODO: sanitize
        }).then(course => {
            createEventsForCourse(req, res, course).then(_ => {
                res.redirect('/courses/' + req.params.courseId);
            });
        });
    }).catch(error => {
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
