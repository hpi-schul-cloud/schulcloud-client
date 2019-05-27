const _ = require('lodash');
const express = require('express');
const moment = require('moment');
const router = express.Router({ mergeParams: true });
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionHelper = require('../helpers/permissions');

const markSelected = (options, values = []) => {
    return options.map(option => {
        option.selected = values.includes(option._id);
        return option;
    });
};

const editCourseGroupHandler = (req, res, next) => {
    let courseGroupId = req.params.courseGroupId;
    let courseId = req.params.courseId;

    let courseGroupPromise, action, method;
    if (courseGroupId) {
        action = `/courses/${courseId}/groups/${courseGroupId}`;
        method = 'patch';
        courseGroupPromise = api(req).get('/courseGroups/' + courseGroupId, {
            qs: {
                $populate: ['userIds']
            }
        });
    } else {
        action = `/courses/${courseId}/groups`;
        method = 'post';
        courseGroupPromise = Promise.resolve({});
    }

    const coursePromise = api(req).get('/courses/' + courseId, {
        qs: {
            $populate: ['userIds']
        }
    });

    Promise.all([
        courseGroupPromise,
        coursePromise
    ]).then(([courseGroup, course]) => {
        let students = course.userIds.filter(s => s.schoolId === res.locals.currentSchool);
        _.each(students, s => s.displayName = `${s.firstName} ${s.lastName}`);

        // if not a teacher, automatically add student to group, just when adding courseGroups
        if (!permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT') && !courseGroupId) {
            courseGroup.userIds = [];
            courseGroup.userIds.push(res.locals.currentUser);
        }

        res.render('courses/edit-courseGroup', {
            action,
            method,
            courseGroup,
            courseId,
            students: markSelected(students, _.map(courseGroup.userIds, '_id')),
            title: req.params.courseGroupId ? 'Schülergruppe bearbeiten' : 'Schülergruppe anlegen',
            submitLabel: req.params.courseGroupId ? 'Änderungen speichern' : 'Schülergruppe anlegen',
            closeLabel: 'Abbrechen'
        });
    });
};

// secure routes
router.use(authHelper.authChecker);

router.get('/add', editCourseGroupHandler);

router.post('/', function(req, res, next) {

    // if not a teacher, automatically add student to group
    if (!permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT')) {
        if (!_.some(req.body.userIds, u => JSON.stringify(u) === JSON.stringify(res.locals.currentUser._id))) {

            if (!req.body.userIds)
                req.body.userIds = [];

            req.body.userIds.push(res.locals.currentUser._id);
        }
    }

    api(req).post('/courseGroups/', {
        json: req.body // TODO: sanitize
    }).then(courseGroup => {
        res.redirect('/courses/' + req.params.courseId + '/groups');
    }).catch(err => {
        res.sendStatus(500);
    });
});

router.get('/:courseGroupId/', function(req, res, next) {
    Promise.all([
        api(req).get('/courseGroups/' + req.params.courseGroupId, {
            qs: {
                $populate: ['userIds']
            }
        }),
        api(req).get('/lessons', {
            qs: {
                courseGroupId: req.params.courseGroupId,
                $sort: 'position'
            }
        }),
        // just for teacher details
        api(req).get('/courses/' + req.params.courseId, {
            qs: {
                $populate: ['teacherIds']
            }
        }),
        api(req).get('/submissions/', {
            qs: {
                courseGroupId: req.params.courseGroupId,
                $populate: ['homeworkId']
            }
        }),
        api(req).get('/homework/', {
            qs: {
                courseId: req.params.courseId
            }
        })
    ]).then(([courseGroup, lessons, course, doneSubmissions, openSubmissions]) => {

        // set params for sc-cards
        doneSubmissions = (doneSubmissions.data || []).map(s => {
            s.title = 'Hausaufgabe: ' + s.homeworkId.name;
            s.content = s.homeworkId.description.substr(0, 140);
            s.secondaryTitle = 'Abgabe: ' + moment(s.updatedAt).format('DD.MM.YY HH:mm');
            s.background = course.color;
            s.url = '/homework/' +  s.homeworkId._id + '/#activetabid=submission';
            return s;
        });
        
        lessons = (lessons.data || []).map(lesson => {
            return Object.assign(lesson, {
                url: '/courses/' + req.params.courseId + '/topics/' + lesson._id + '?courseGroup=' + req.params.courseGroupId
            });
        });

        // get team-homework which does not have an group-submission from this group
        openSubmissions = (openSubmissions.data || [])
            .filter(os => os.teamSubmissions)
            .filter(os => os.maxTeamMembers >= (courseGroup.userIds || []).length)
            .filter(os => _.every(doneSubmissions, s => JSON.stringify(s.homeworkId._id) !== JSON.stringify(os._id)))
            .map(os => {
                os.title = 'Hausaufgabe: ' + os.name;
                os.content = os.description.substr(0, 140);
                os.secondaryTitle = 'bis zum: ' + moment(os.dueDate).format('DD.MM.YY HH:mm');
                os.background = course.color;
                os.url = '/homework/' +  os._id;
                return os;
            });

        // get display names for teachers and students
        _.each(courseGroup.userIds, u => u.displayName = `${u.firstName} ${u.lastName}`);
        _.each(course.teacherIds, t => t.displayName = `${t.firstName} ${t.lastName}`);

        res.render('courses/courseGroup', Object.assign({}, courseGroup, {
            course,
            title: courseGroup.name,
            lessons,
            doneSubmissions,
            openSubmissions,
            breadcrumb: [{
                    title: 'Meine Kurse',
                    url: '/courses'
                },
                {
                    title: course.name,
                    url: '/courses/' + course._id
                }
            ]
        }));
    });
});

router.patch('/:courseGroupId', function(req, res, next) {

    if (!req.body.userIds)
        req.body.userIds = [];

    // if not a teacher, automatically add student to group
    if (!permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT')) {
        if (!_.some(req.body.userIds, u => JSON.stringify(u) === JSON.stringify(res.locals.currentUser._id))) {
            req.body.userIds.push(res.locals.currentUser._id);
        }
    }

    api(req).patch('/courseGroups/' + req.params.courseGroupId, {
        json: req.body // TODO: sanitize
    }).then(_ => {
        res.redirect('/courses/' + req.params.courseId + '/groups/' + req.params.courseGroupId);
    }).catch(error => {
        res.sendStatus(500);
    });
});


router.get('/:courseGroupId/edit', editCourseGroupHandler);

router.delete('/:courseGroupId', function(req, res, next) {
    api(req).delete('/courseGroups/' + req.params.courseGroupId).then(_ => {
        res.sendStatus(200);
    });
});

module.exports = router;