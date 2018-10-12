const _ = require('lodash');
const express = require('express');
const router = express.Router();
const marked = require('marked');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const recurringEventsHelper = require('../helpers/recurringEvents');
const permissionHelper = require('../helpers/permissions');
const moment = require('moment');
const shortId = require('shortid');
const logger = require('winston');

const thumbs = {
    default: "/images/thumbs/default.png",
    psd: "/images/thumbs/psds.png",
    txt: "/images/thumbs/txts.png",
    doc: "/images/thumbs/docs.png",
    png: "/images/thumbs/pngs.png",
    mp4: "/images/thumbs/mp4s.png",
    mp3: "/images/thumbs/mp3s.png",
    aac: "/images/thumbs/aacs.png",
    avi: "/images/thumbs/avis.png",
    gif: "/images/thumbs/gifs.png",
    html: "/images/thumbs/htmls.png",
    js: "/images/thumbs/jss.png",
    mov: "/images/thumbs/movs.png",
    xls: "/images/thumbs/xlss.png",
    xlsx: "/images/thumbs/xlss.png",
    pdf: "/images/thumbs/pdfs.png",
    flac: "/images/thumbs/flacs.png",
    jpg: "/images/thumbs/jpgs.png",
    jpeg: "/images/thumbs/jpgs.png",
    docx: "/images/thumbs/docs.png",
    ai: "/images/thumbs/ais.png",
    tiff: "/images/thumbs/tiffs.png"
};

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
            return api(req).post("/calendar", {
                json: {
                    summary: course.name,
                    location: time.room,
                    description: course.description,
                    startDate: new Date(new Date(course.startDate).getTime() + time.startTime).toLocalISOString(),
                    duration: time.duration,
                    repeat_until: course.untilDate,
                    frequency: "WEEKLY",
                    weekday: recurringEventsHelper.getIsoWeekdayForNumber(time.weekday),
                    scopeId: course._id,
                    courseId: course._id,
                    courseTimeId: time._id
                }
            })
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
        return api(req).get('teams/' + courseId).then(course => {
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
    if (req.params.courseId) {
        action = '/teams/' + req.params.courseId;
        method = 'patch';
        coursePromise = api(req).get('/teams/' + req.params.courseId);
    } else {
        action = '/teams/';
        method = 'post';
        coursePromise = Promise.resolve({});
    }

    coursePromise.then(course => {
        res.render('teams/edit-team', {
            action,
            method,
            title: req.params.courseId ? 'Team bearbeiten' : 'Team anlegen',
            submitLabel: req.params.courseId ? 'Änderungen speichern' : 'Team anlegen',
            closeLabel: 'Abbrechen',
            course
        });
    });
};

const copyCourseHandler = (req, res, next) => {
    let coursePromise, action, method;
    if (req.params.courseId) {
        action = '/teams/copy/' + req.params.courseId;
        method = 'post';
        coursePromise = api(req).get('/teams/' + req.params.courseId, {
            qs: {
                $populate: ['ltiToolIds', 'classIds', 'teacherIds', 'userIds', 'substitutionIds']
            }
        });
    } else {
        action = '/teams/copy';
        method = 'post';
        coursePromise = Promise.resolve({});
    }

    const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
    const teachersPromise = getSelectOptions(req, 'users', { roles: ['teacher', 'demoTeacher'], $limit: 1000 });
    const studentsPromise = getSelectOptions(req, 'users', { roles: ['student', 'demoStudent'], $limit: 1000 });

    Promise.all([
        coursePromise,
        classesPromise,
        teachersPromise,
        studentsPromise
    ]).then(([course, classes, teachers, students]) => {

        classes = classes.filter(c => c.schoolId == res.locals.currentSchool);
        teachers = teachers.filter(t => t.schoolId == res.locals.currentSchool);
        students = students.filter(s => s.schoolId == res.locals.currentSchool);
        let substitutions = _.cloneDeep(teachers);

        // map course times to fit into UI
        (course.times || []).forEach((time, count) => {
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

        course.name = course.name + ' - Kopie';

        res.render('teams/edit-course', {
            action,
            method,
            title: 'Kurs klonen',
            submitLabel: 'Kurs klonen',
            closeLabel: 'Abbrechen',
            course,
            classes: classes,
            teachers: markSelected(teachers, _.map(course.teacherIds, '_id')),
            substitutions: substitutions,
            students: students
        });
    });
};

// secure routes
router.use(authHelper.authChecker);

/*
 * teams
 */

router.get('/', async function(req, res, next) {
    let courses = await api(req).get('/teams/', {
        qs: {
            userIds: {
                $elemMatch: { userId: res.locals.currentUser._id }
            },
            $limit: 75
        }
    });

    courses = courses.data.map(course => {
        course.url = '/teams/' + course._id;
        course.title = course.name;
        course.content = (course.description||"").substr(0, 140);
        course.secondaryTitle = '';
        course.background = course.color;
        course.memberAmount = course.userIds.length;
        (course.times || []).forEach(time => {
            time.startTime = moment(time.startTime, "x").utc().format("HH:mm");
            time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday);
            course.secondaryTitle += `<div>${time.weekday} ${time.startTime} ${(time.room)?('| '+time.room):''}</div>`;
        });

        return course;
    });
    if (req.query.json) {
        res.json(courses);
    } else {
        res.render('teams/overview', {
            title: 'Meine Teams',
            courses,
            // substitutionCourses,
            searchLabel: 'Suche nach Teams',
            searchAction: '/teams',
            showSearch: true,
            liveSearch: true
        });
    }
    // });
});

router.post('/', function(req, res, next) {
    // map course times to fit model
    (req.body.times || []).forEach(time => {
        time.startTime = moment.duration(time.startTime, "HH:mm").asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    req.body.startDate = moment(req.body.startDate, "DD:MM:YYYY")._d;
    req.body.untilDate = moment(req.body.untilDate, "DD:MM:YYYY")._d;

    if (!(moment(req.body.startDate, 'YYYY-MM-DD').isValid()))
        delete req.body.startDate;
    if (!(moment(req.body.untilDate, 'YYYY-MM-DD').isValid()))
        delete req.body.untilDate;

    api(req).post('/teams/', {
        json: req.body // TODO: sanitize
    }).then(course => {
        createEventsForCourse(req, res, course).then(_ => {
            res.redirect('/teams/' + course._id);
        })
    }).catch(err => {
        logger.warn(err);       //todo add req.body
        res.sendStatus(500);
    });
});

router.post('/copy/:courseId', function(req, res, next) {
    // map course times to fit model
    (req.body.times || []).forEach(time => {
        time.startTime = moment.duration(time.startTime, "HH:mm").asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    req.body.startDate = moment(req.body.startDate, "DD:MM:YYYY")._d;
    req.body.untilDate = moment(req.body.untilDate, "DD:MM:YYYY")._d;

    if (!(moment(req.body.startDate, 'YYYY-MM-DD').isValid()))
        delete req.body.startDate;
    if (!(moment(req.body.untilDate, 'YYYY-MM-DD').isValid()))
        delete req.body.untilDate;

    req.body._id = req.params.courseId;

    api(req).post('/teams/copy/', {
        json: req.body // TODO: sanitize
    }).then(course => {
        res.redirect('/teams/' + course._id);
    }).catch(err => {
        res.sendStatus(500);
    });
});

router.get('/add/', editCourseHandler);


/*
 * Single Course
 */

router.get('/:courseId/json', function(req, res, next) {
    Promise.all([
        api(req).get('/teams/' + req.params.courseId, {
            qs: {
                $populate: ['ltiToolIds']
            }
        }),
        api(req).get('/lessons/', {
            qs: {
                courseId: req.params.courseId
            }
        })
    ]).then(([course, lessons]) => res.json({ course, lessons }));
});

router.get('/:courseId/usersJson', function(req, res, next) {
    Promise.all([
        api(req).get('/teams/' + req.params.courseId, {
            qs: {
                $populate: ['userIds']
            }
        })
    ]).then(([course]) => res.json({ course }));
});

router.get('/:courseId', async function(req, res, next) {
    try {
        const course = await api(req).get('/teams/' + req.params.courseId, {
            qs: {
                $populate: ['ltiToolIds']
            }
        });

        let data = await api(req).get('/fileStorage', {
            qs: { path: 'teams/' + course._id + '/' }
        });
        let files = data.files.map(file => {
            file.file = file.key;
            let ending = file.name.split('.').pop();
            file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
            return file;
        });

        if (data.directories && data.directories.length > 0) {
            const filesPromises = data.directories.map(dir => {
                return api(req).get('/fileStorage', {
                    qs: {
                        path: dir.key + '/'
                    }
                });
            });
            const dataSubdirectories = await Promise.all(filesPromises);
            let subdirectoriesFiles = dataSubdirectories.map(sub => {
                return sub.files.map(file => {
                    file.file = file.key;
                    let ending = file.name.split('.').pop();
                    file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
                    return file;
                });
            });
            subdirectoriesFiles = subdirectoriesFiles[0];

            files = files.concat(subdirectoriesFiles);
        }

        // Sort by most recent files and limit to 6 files
        files = files.sort(function(a,b){
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        files = files.slice(0, 6);

        res.render('teams/team', Object.assign({}, course, {
            title: course.name,
            breadcrumb: [{
                    title: 'Meine Teams',
                    url: '/teams'
                },
                {}
            ],
            permissions: course.user.permissions,
            course,
            files,
            filesUrl: `/files/teams/${req.params.courseId}`,
            nextEvent: recurringEventsHelper.getNextEventForCourseTimes(course.times)
        }));
    } catch (e) {
        next(e);
    }
});

router.get('/:courseId/members', async function(req, res, next) {
    const action = '/teams/' + req.params.courseId;
    const method = 'patch';
    let course, courseUserIds;

    try {
        course = await api(req).get('/teams/' + req.params.courseId, {
            qs: {
                $populate: [
                    {
                        path: 'userIds.userId',
                        populate: ['schoolId']
                    }, {
                        path: 'userIds.role',
                    }
                ]
            }
        });
        courseUserIds = course.userIds.map(user => user.userId._id);

        const users = (await api(req).get('/users', {
            qs: {
                _id: {
                    $nin: courseUserIds
                }
            }
        })).data;

        let roles = (await api(req).get('/roles', {
            qs: {
                name: {
                    $in: ['teammember', 'teamexpert', 'teamleader',
                        'teamadministrator', 'teamowner']
                }
            }
        })).data;

        const roleTranslations = {
            teammember: 'Teilnehmer',
            teamexpert: 'externer Experte',
            teamleader: 'Leiter',
            teamadministrator: 'Team-Admin',
            teamowner: 'Team-Admin (Eigentümer)',
        };

        roles = roles.map(role => {
            role.label = roleTranslations[role.name];
            return role;
        });

        const rolesExternal = [
            // TODO: Wieder reinnehmen, sobald externer Experte einladen geht
            // {
            //     name: 'teamexpert',
            //     label: 'externer Experte',
            //     _id: roles.find(role => role.name === 'teamexpert')
            // },
            {
                name: 'teamadministrator',
                label: 'Lehrer anderer Schule (Team-Admin)',
                _id: roles.find(role => role.name === 'teamadministrator')
            }
        ];

        let head = [
            'Vorname',
            'Nachname',
            'Rolle',
            'Schule',
            'Aktionen'
        ];

        const body = course.userIds.map(user => {
            let row = [
                user.userId.firstName || '',
                user.userId.lastName || '',
                roleTranslations[user.role.name],
                user.userId.schoolId.name || '',
                {
                    payload: {
                        userId: user.userId._id
                    }
                }
            ];


            let actions = [];

            if (course.user.permissions.includes('CHANGE_TEAM_ROLES')) {
                actions.push({
                    class: 'btn-edit-member',
                    title: 'Rolle bearbeiten',
                    icon: 'edit'
                });
            }

            if (course.user.permissions.includes('REMOVE_MEMBERS')) {
                actions.push({
                    class: 'btn-delete-member',
                    title: 'Nutzer entfernen',
                    icon: 'trash'
                });
            }

            row.push(actions);

            return row;
        });

        let headInvitations = [
            'E-Mail',
            'Eingeladen am',
            'Rolle',
            'Aktionen'
        ];

        const invitationActions = [{
            class: 'btn-edit-invitation',
            title: 'Einladung bearbeiten',
            icon: 'edit'
        }];

        const bodyInvitations = [
            ['marco@polo.de', '24. September 2018', 'Experte', invitationActions],
            ['axel@schweiss.de', '4. Oktober 2018', 'Experte', invitationActions]
        ];

        res.render('teams/members', Object.assign({}, course, {
            title: 'Deine Team-Teilnehmer',
            action,
            addMemberAction: `/teams/${req.params.courseId}/members`,
            inviteExternalMemberAction: `/teams/${req.params.courseId}/members/external`,
            deleteMemberAction: `/teams/${req.params.courseId}/members`,
            permissions: course.user.permissions,
            method,
            head,
            body,
            roles,
            rolesExternal,
            headInvitations,
            bodyInvitations,
            users,
            breadcrumb: [{
                    title: 'Meine Teams',
                    url: '/teams'
                },
                {
                    title: course.name,
                    url: '/teams/' + course._id
                },
                {}
            ]
        }));
    } catch (e) {
        next(e);
    }
});

router.get('/:courseId/topics', async function(req, res, next) {
    Promise.all([
        api(req).get('/teams/' + req.params.courseId, {
            qs: {
                $populate: ['ltiToolIds']
            }
        }),
        api(req).get('/lessons/', {
            qs: {
                courseId: req.params.courseId,
                $sort: 'position'
            }
        }),
        api(req).get('/homework/', {
            qs: {
                courseId: req.params.courseId,
                $populate: ['courseId'],
                archived: { $ne: res.locals.currentUser._id }
            }
        }),
        api(req).get('/courseGroups/', {
            qs: {
                courseId: req.params.courseId,
                $populate: ['courseId', 'userIds'],
            }
        })
    ]).then(([course, lessons, homeworks, courseGroups]) => {
        let ltiToolIds = (course.ltiToolIds || []).filter(ltiTool => ltiTool.isTemplate !== 'true');
        lessons = (lessons.data || []).map(lesson => {
            return Object.assign(lesson, {
                url: '/teams/' + req.params.courseId + '/topics/' + lesson._id + '/'
            });
        });

        homeworks = (homeworks.data || []).map(assignment => {
            assignment.url = '/homework/' + assignment._id;
            return assignment;
        });

        homeworks.sort((a, b) => {
            if (a.dueDate > b.dueDate) {
                return 1;
            } else {
                return -1;
            }
        });

        courseGroups = permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT') ?
            courseGroups.data || [] :
            (courseGroups.data || []).filter(cg => cg.userIds.some(user => user._id === res.locals.currentUser._id));

        res.render('teams/topics', Object.assign({}, course, {
            title: course.name,
            lessons,
            homeworks: homeworks.filter(function(task) { return !task.private; }),
            myhomeworks: homeworks.filter(function(task) { return task.private; }),
            ltiToolIds,
            courseGroups,
            breadcrumb: [{
                    title: 'Meine Teams',
                    url: '/teams'
                },
                {
                    title: course.name,
                    url: '/teams/' + course._id
                },
                {}
            ],
            filesUrl: `/files/teams/${req.params.courseId}`,
            nextEvent: recurringEventsHelper.getNextEventForCourseTimes(course.times)
        }));
    }).catch(err => {
        next(err);
    });
});

router.patch('/:courseId', async function(req, res, next) {
    // map course times to fit model
    req.body.times = req.body.times || [];
    req.body.times.forEach(time => {
        time.startTime = moment.duration(time.startTime).asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    req.body.startDate = moment(req.body.startDate, "DD:MM:YYYY")._d;
    req.body.untilDate = moment(req.body.untilDate, "DD:MM:YYYY")._d;

    if (!(moment(req.body.startDate, 'YYYY-MM-DD').isValid()))
        delete req.body.startDate;
    if (!(moment(req.body.untilDate, 'YYYY-MM-DD').isValid()))
        delete req.body.untilDate;

    // first delete all old events for the course
    // deleteEventsForCourse(req, res, req.params.courseId).then(async _ => {

    await api(req).patch('/teams/' + req.params.courseId, {
        json: req.body // TODO: sanitize
    });

    // await createEventsForCourse(req, res, courseUpdated);

    res.redirect('/teams/' + req.params.courseId);

    // }).catch(error => {
    //     res.sendStatus(500);
    // });
});

router.post('/:courseId/members', async function(req, res, next) {
    const courseOld = await api(req).get('/teams/' + req.params.courseId);
    let userIds = courseOld.userIds.concat(req.body.userIds);

    await api(req).patch('/teams/' + req.params.courseId, {
        json: {
            userIds
        }
    });

    res.sendStatus(200);
});

router.patch('/:courseId/members', async function(req, res, next) {
    const course = await api(req).get('/teams/' + req.params.courseId);
    const userIds = course.userIds.map(user => {
        if (user.userId === req.body.user.userId) {
            user.role = req.body.user.role;
        }
        return user;
    });

    await api(req).patch('/teams/' + req.params.courseId, {
        json: {
            userIds
        }
    });

    res.sendStatus(200);
});

router.post('/:courseId/members/external', async function(req, res, next) {
    await api(req).patch('/teams/' + req.params.courseId, {
        json: {
            email: req.body.email,
            role: req.body.role
        }
    });

    res.sendStatus(200);
});

router.delete('/:courseId/members', async function(req, res, next) {
    const courseOld = await api(req).get('/teams/' + req.params.courseId);
    let userIds = courseOld.userIds.filter(user => user.userId !== req.body.userIdToRemove);

    await api(req).patch('/teams/' + req.params.courseId, {
        json: {
            userIds
        }
    });

    res.sendStatus(200);
});

router.patch('/:courseId/positions', function(req, res, next) {
    for (var elem in req.body) {
        api(req).patch('/lessons/' + elem, {
            json: {
                position: parseInt(req.body[elem]),
                courseId: req.params.courseId
            }
        });
    }

    res.sendStatus(200);
});


router.delete('/:courseId', function(req, res, next) {
    deleteEventsForCourse(req, res, req.params.courseId).then(_ => {
        api(req).delete('/teams/' + req.params.courseId).then(_ => {
            res.sendStatus(200);
        });
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.get('/:courseId/addStudent', function(req, res, next) {
    let currentUser = res.locals.currentUser;
    // if currentUser isn't a student don't add to course-students
    if (currentUser.roles.filter(r => r.name === 'student').length <= 0) {
        req.session.notification = {
            type: 'danger',
            message: "Sie sind kein Nutzer der Rolle 'Schüler'."
        };
        res.redirect('/teams/' + req.params.courseId);
        return;
    }

    // check if student is already in course
    api(req).get('/teams/' + req.params.courseId).then(course => {
        if (_.includes(course.userIds, currentUser._id)) {
            req.session.notification = {
                type: 'danger',
                message: `Sie sind bereits Teilnehmer des Kurses/Fachs ${course.name}.`
            };
            res.redirect('/teams/' + req.params.courseId);
            return;
        }

        // add Student to course
        course.userIds.push(currentUser._id);
        api(req).patch("/teams/" + course._id, {
            json: course
        }).then(_ => {
            req.session.notification = {
                type: 'success',
                message: `Sie wurden erfolgreich beim Kurs/Fach ${course.name} hinzugefügt`
            };
            res.redirect('/teams/' + req.params.courseId);
        });
    }).catch(err => {
        next(err);
    });
});

router.post('/:courseId/importTopic', function(req, res, next) {
    let shareToken = req.body.shareToken;
    // try to find topic for given shareToken
    api(req).get("/lessons/", { qs: { shareToken: shareToken, $populate: ['courseId'] } }).then(lessons => {
        if ((lessons.data || []).length <= 0) {
            req.session.notification = {
                type: 'danger',
                message: 'Es wurde kein Thema für diesen Code gefunden.'
            };

            res.redirect(req.header('Referer'));
        }

        api(req).post("/lessons/copy", { json: {lessonId: lessons.data[0]._id, newCourseId: req.params.courseId, shareToken}})
            .then(_ => {
                res.redirect(req.header('Referer'));
            });

    }).catch(err => res.status((err.statusCode || 500)).send(err));
});


router.get('/:courseId/edit', editCourseHandler);

router.get('/:courseId/copy', copyCourseHandler);

// return shareToken
router.get('/:id/share', function(req, res, next) {
    return api(req).get('/teams/share/' + req.params.id)
        .then(course => {
            return res.json(course);
    });
});

// return course Name for given shareToken
router.get('/share/:id', function (req, res, next) {
   return api(req).get('/teams/share', { qs: { shareToken: req.params.id }})
        .then(name => {
            return res.json({ msg: name, status: 'success' });
        })
       .catch(err => {
            return res.json({ msg: 'ShareToken is not in use.', status: 'error' });
       });
});

router.post('/import', function(req, res, next) {
    let shareToken = req.body.shareToken;
    let courseName = req.body.name;

    api(req).post('/teams/share', { json: { shareToken, courseName }})
        .then(course => {
            res.redirect(`/teams/${course._id}/edit/`);
        })
        .catch(err => {
            res.status((err.statusCode || 500)).send(err);
        });
});

/**
 * Generates short team invite link. can be used as function or as hook call.
 * @param params = object {
 *      role: user role = string "teamexpert"/"teamadministrator"
 *      host: current webaddress from client = string, looks for req.headers.origin first
 *      teamId: users teamId = string
 *      invitee: user who gets invited = string
 *      save: make hash link-friendly? = boolean (might be string)
 *  }
 * @param internalReturn: just return results to callee if true, for use as a hook false = boolean
 */
const generateInviteLink = (params, internalReturn) => {
    return function (req, res, next) {
        let options = JSON.parse(JSON.stringify(params));
        if (!options.role) options.role = req.body.role || "";
        if (!options.host) options.host = req.headers.origin || req.body.host || "";
        if (!options.teamId) options.teamId = req.body.teamId || "";
        if (!options.invitee) options.invitee = req.body.email || req.body.invitee || "";
        if (!options.save) options.save = req.body.save || "true";
        options.inviter = res.locals.currentUser._id;

        if(internalReturn){
            return api(req).post("/teaminvitelink/", {
                json: options
            });
        } else {
            return api(req).post("/teaminvitelink/", {
                json: options
            }).then(linkData => {
                res.locals.linkData = linkData;
                res.locals.options = options;
                next();
            }).catch(err => {
                req.session.notification = {
                    'type': 'danger',
                    'message': `Fehler beim Erstellen des Registrierungslinks. Bitte selbstständig Registrierungslink im Nutzerprofil generieren und weitergeben. ${(err.error||{}).message || err.message || err || ""}`
                };
                res.redirect(req.header('Referer'));
            });
        }
    };
};

const sendMailHandler = (internalReturn) => {
    return function (req, res, next) {
        let data = Object.assign(res.locals.options, res.locals.linkData);
        if(data.invitee && data.teamId && data.shortLink && data.role) {
            let inviteText = '';
            if (data.role === 'teamadministrator') {
                inviteText = `Hallo ${data.invitee}!
\nDu wurdest eingeladen, einem Team der ${res.locals.theme.short_title} beizutreten, bitte klicke auf diesen Link, um die Einladung anzunehmen: ${data.shortLink}
\nViel Spaß und gutes Gelingen wünscht dir dein
${res.locals.theme.short_title}-Team`
            } else {
                inviteText = `Hallo ${data.invitee}!
\nDu wurdest eingeladen, einem Team der ${res.locals.theme.short_title} beizutreten. Da du noch keinen ${res.locals.theme.short_title} Account besitzt, folge bitte diesem Link, um die Registrierung abzuschließen und dem Team beizutreten: ${data.shortLink}
\nViel Spaß und einen guten Start wünscht dir dein
${res.locals.theme.short_title}-Team`
            }
            return api(req).post('/mails/', {
                json: {
                    email: data.invitee,
                    subject: `Einladung in ein Team der ${res.locals.theme.short_title}!`,
                    headers: {},
                    content: {
                        "text": inviteText
                    }
                }
            }).then(_ => {
                if(internalReturn) return true;
                next();
            }).catch(err => {
                if(internalReturn) return false;
                next();
            });
        } else {
            if(internalReturn) return true;
            next();
        }
    }
};

// client-side use
// WITH PERMISSION - NEEDED FOR LIVE
// router.post('/invitelink/', permissionHelper.permissionsChecker(['ADD_SCHOOL_MEMBERS']), generateInviteLink({}), sendMailHandler(), (req, res) => { res.json(res.locals.linkData) });
router.post('/invitelink/', generateInviteLink({}), sendMailHandler(), (req, res) => { res.json({inviteCallDone:true}) });

const addUserToTeam = (params, internalReturn) => {
    return function (req, res, next) {
        let errornotification = {type: 'danger',message: `Fehler beim Einladen in das Team.`};
        if (["teamadministrator","teamexpert"].includes(req.params.role) && req.query.shortId) {
            return api(req).patch('/teams/adduser/', {json:{shortId: req.query.shortId}})
                .then(result => {
                    if(result._id){
                        if(internalReturn) return true;
                        req.session.notification = {
                            type: 'success',
                            message: `Du wurdest dem Team erfolgreich hinzugefügt.`
                        };
                        res.redirect('/teams/'+result._id);
                    } else {
                        if(internalReturn) return false;
                        req.session.notification = errornotification;
                        res.redirect('/teams/');
                    }
                })
                .catch(err => {
                    if(internalReturn) return false;
                    req.session.notification = errornotification;
                    res.redirect('/teams/');
                });
        } else {
            if(internalReturn) return false;
            req.session.notification = errornotification;
            res.redirect('/teams/');
        }
    }
};

router.get('/invite/:role/to/:teamHash', addUserToTeam());


module.exports = router;