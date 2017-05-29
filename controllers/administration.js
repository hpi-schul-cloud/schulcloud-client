/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const recurringEventsHelper = require('../helpers/recurringEvents');
const moment = require('moment');

const getSelectOptions = (req, service, query, values = []) => {
    return api(req).get('/' + service, {
        qs: query
    }).then(data => {
        return data.data;
    });
};


const getTableActions = (item, path) => {
    return [
        {
            link: path + item._id,
            class: 'btn-edit',
            icon: 'edit'
        },
        {
            link: path + item._id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete'
        }
    ];
};

/**
 * maps the event props from the server to fit the ui components, e.g. date and time
 * @param data {object} - the plain data object
 * @param service {string} - the model or service type
 */
const mapEventProps = (data, service) => {
    if (service === 'courses') {
        // map course times to fit into UI
        (data.times || []).forEach((time, count) => {
            time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday);
            time.duration = time.duration / 1000 / 60;
            time.startTime = moment(time.startTime, "x").format("HH:mm");
            time.count = count;
        });

        // format course start end until date
        if (data.startDate) {
            data.startDate = moment(new Date(data.startDate).getTime()).format("YYYY-MM-DD");
            data.untilDate = moment(new Date(data.untilDate).getTime()).format("YYYY-MM-DD");
        }
    }

    return data;
};

/**
 * maps the request-data to fit model, e.g. for course times
 * @param data {object} - the request-data object
 * @param service {string} - maps
 */
const mapTimeProps = (req, res, next) => {
    // map course times to fit model
    req.body.times = req.body.times || [];
    (req.body.times || []).forEach(time => {
        time.weekday = recurringEventsHelper.getNumberForWeekday(time.weekday);
        time.startTime = moment.duration(time.startTime, "HH:mm").asMilliseconds();
        time.duration = time.duration * 60 * 1000;
    });

    next();
};

/**
 * creates an event for a created course. following params has to be included in @param data for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 0 to 6, the weekday the course take place
 * @param data {object}
 * @param service {string}
 */
const createEventsForData = (data, service, req, res) => {
    // can just run if a calendar service is running on the environment and the course have a teacher
    if (process.env.CALENDAR_SERVICE_ENABLED && service === 'courses' && data.teacherIds[0]) {
        return Promise.all(data.times.map(time => {
            return api(req).post("/calendar", {
                json: {
                    summary: data.name,
                    location: res.locals.currentSchoolData.name,
                    description: data.description,
                    startDate: new Date(new Date(data.startDate).getTime() + time.startTime).toISOString(),
                    duration: time.duration,
                    repeat_until: data.untilDate,
                    frequency: "WEEKLY",
                    weekday: recurringEventsHelper.getIsoWeekdayForNumber(time.weekday),
                    scopeId: data._id,
                    courseId: data._id,
                    courseTimeId: time._id
                },
                qs: {userId: data.teacherIds[0]}
            });
        }));
    }

    return Promise.resolve(true);
};

/**
 * Deletes all events from the given dataId in @param req.params, clear function
 * @param service {string}
 */
const deleteEventsForData = (service) => {
    return function (req, res, next) {
        if (process.env.CALENDAR_SERVICE_ENABLED && service === 'courses') {
            return api(req).get('courses/' + req.params.id).then(course => {
                if (course.teacherIds.length < 1) next(); // if no teacher, no permission for deleting
                return Promise.all((course.times || []).map(t => {
                    if (t.eventId) {
                        return api(req).delete('calendar/' + t.eventId, {qs: {userId: course.teacherIds[0]}});
                    }
                })).then(_ => next());
            });
        }

        next();
    };
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.locals.createdUser = data;
            createEventsForData(data, service, req, res).then(_ => {
                next();
            });
        }).catch(err => {
            next(err);
        });
    };
};


const getUpdateHandler = (service) => {
    return function (req, res, next) {
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            createEventsForData(data, service, req, res).then(_ => {
                res.redirect(req.header('Referer'));
            });
        }).catch(err => {
            next(err);
        });
    };
};


const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
            res.json(mapEventProps(data, service));
        }).catch(err => {
            next(err);
        });
    };
};


const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const getDeleteAccountForUserHandler = (req, res, next) => {
    api(req).get("/accounts/", {
        qs: {
            userId: req.params.id
        }
    }).then(accounts => {
        // if no account find, user isn't fully registered
        if (!accounts || accounts.length <= 0) {
            next();
            return;
        }

        // for now there is only one account for a given user
        let account = accounts[0];
        api(req).delete("/accounts/" + account._id).then(_ => {
            next();
        });
    }).catch(err => {
        console.log(err);
        next(err);
    })
};

const removeSystemFromSchoolHandler = (req, res, next) => {
    api(req).patch('/schools/' + res.locals.currentSchool, {
        json: {
            $pull: {
                systems: req.params.id
            }
        }
    }).then(_ => {
        next();
    }).catch(err => {
        next(err);
    });
};

const createSystemHandler = (req, res, next) => {
    api(req).post('/systems/', {json: req.body}).then(system => {
        api(req).patch('/schools/' + req.body.schoolId, {
            json: {
                $push: {
                    systems: system._id
                }
            }
        }).then(data => {
            next();
        }).catch(err => {
            next(err);
        });
    });
};

const getStorageProviders = () => {
    return [
        {label: 'AWS S3', value: 'awsS3'}
    ];
};

const getSSOTypes = () => {
    return [
        {label: 'Moodle', value: 'moodle'},
        {label: 'ITSLearning', value: 'itslearning'},
        {label: 'LernSax', value: 'lernsax'}
    ];
};

const createBucket = (req, res, next) => {
    if (req.body.fileStorageType) {
        Promise.all([
            api(req).post('/fileStorage', {
                json: {fileStorageType: req.body.fileStorageType, schoolId: req.params.id}
            }),
            api(req).patch('/schools/' + req.params.id, {
                json: req.body
            })]).then(data => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    }
};

const sendMailHandler = (req, res, next) => {
    let createdUser = res.locals.createdUser;
    let email = createdUser.email;
    fs.readFile(path.join(__dirname, '../views/template/registration.hbs'), (err, data) => {
        if (!err) {
            let source = data.toString();
            let template = handlebars.compile(source);
            let outputString = template({
                "url": req.headers.origin + "/register/account/" + createdUser._id,
                "firstName": createdUser.firstName,
                "lastName": createdUser.lastName
            });

            let content = {
                "html": outputString,
                "text": "Sehr geehrte/r " + createdUser.firstName + " " + createdUser.lastName + ",\n\n" +
                "Sie wurden in die Schul-Cloud eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
                req.headers.origin + "/register/account/" + createdUser._id + "\n\n" +
                "Mit Freundlichen Grüßen" + "\nIhr Schul-Cloud Team"
            };
            req.body.content = content;
            api(req).post('/mails', {
                json: {
                    headers: {},
                    email: email,
                    subject: "Einladung in die Schul-Cloud",
                    content: content
                }
            }).then(_ => {
                next();
            }).catch(err => {
                res.status((err.statusCode || 500)).send(err);
            });
        } else {
            next(err);
        }
    });
};

// secure routes
router.use(authHelper.authChecker);
router.use(permissionsHelper.permissionsChecker('ADMIN_VIEW'));


router.patch('/schools/:id', getUpdateHandler('schools'));

router.post('/schools/:id/bucket', createBucket);

router.all('/', function (req, res, next) {
    api(req).get('/schools/' + res.locals.currentSchool).then(data => {
        let provider = getStorageProviders();
        provider = (provider || []).map(prov => {
            if (prov.value == data.fileStorageType) {
                return Object.assign(prov, {
                    selected: true
                });
            } else {
                return prov;
            }
        });

        let ssoTypes = getSSOTypes();

        res.render('administration/school', {title: 'Administration: Allgemein', school: data, provider, ssoTypes});
    });
});


router.post('/courses/', mapTimeProps, getCreateHandler('courses'));
router.patch('/courses/:id', mapTimeProps, deleteEventsForData('courses'), getUpdateHandler('courses'));
router.get('/courses/:id', getDetailHandler('courses'));
router.delete('/courses/:id', getDeleteHandler('courses'), deleteEventsForData('courses'));

router.all('/courses', function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/courses', {
        qs: {
            $populate: ['classIds', 'teacherIds'],
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1)
        }
    }).then(data => {
        const head = [
            'Name',
            'Klasse(n)',
            'Lehrer',
            ''
        ];

        const classesPromise = getSelectOptions(req, 'classes');
        const teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher']});
        const studentsPromise = getSelectOptions(req, 'users', {roles: ['student']});

        Promise.all([
            classesPromise,
            teachersPromise,
            studentsPromise
        ]).then(([classes, teachers, students]) => {
            const body = data.data.map(item => {
                return [
                    item.name,
                    (item.classIds || []).map(item => item.name).join(', '),
                    (item.teacherIds || []).map(item => item.lastName).join(', '),
                    getTableActions(item, '/administration/courses/')
                ];
            });

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/administration/courses/?p={{page}}'
            };

            res.render('administration/courses', {
                title: 'Administration: Kurse',
                head,
                body,
                classes,
                teachers,
                students,
                pagination
            });
        });
    });
});


router.post('/classes/', getCreateHandler('classes'));
router.patch('/classes/:id', getUpdateHandler('classes'));
router.get('/classes/:id', getDetailHandler('classes'));
router.delete('/classes/:id', getDeleteHandler('classes'));

router.all('/classes', function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/classes', {
        qs: {
            $populate: ['teacherIds'],
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1)
        }
    }).then(data => {
        const head = [
            'Bezeichnung',
            'Lehrer',
            ''
        ];

        let teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher']});
        let studentsPromise = getSelectOptions(req, 'users', {roles: ['student']});

        Promise.all([
            teachersPromise,
            studentsPromise
        ]).then(([teachers, students]) => {
            const body = data.data.map(item => {
                return [
                    item.name,
                    (item.teacherIds || []).map(item => item.lastName).join(', '),
                    getTableActions(item, '/administration/classes/')
                ];
            });

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/administration/classes/?p={{page}}'
            };

            res.render('administration/classes', {
                title: 'Administration: Klassen',
                head,
                body,
                teachers,
                students,
                pagination
            });
        });
    });
});


router.post('/teachers/', getCreateHandler('users'), sendMailHandler);
router.patch('/teachers/:id', getUpdateHandler('users'));
router.get('/teachers/:id', getDetailHandler('users'));
router.delete('/teachers/:id', getDeleteAccountForUserHandler, getDeleteHandler('users'));

router.all('/teachers', function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/users', {
        qs: {
            roles: ['teacher'],
            $populate: ['roles'],
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1)
        }
    }).then(data => {
        const head = [
            'Vorname',
            'Nachname',
            'E-Mail-Adresse',
            ''
        ];

        const body = data.data.map(item => {
            return [
                item.firstName,
                item.lastName,
                item.email,
                getTableActions(item, '/administration/teachers/')
            ];
        });

        const pagination = {
            currentPage,
            numPages: Math.ceil(data.total / itemsPerPage),
            baseUrl: '/administration/teachers/?p={{page}}'
        };

        res.render('administration/teachers', {title: 'Administration: Lehrer', head, body, pagination});
    });
});


router.post('/students/', getCreateHandler('users'), sendMailHandler);
router.patch('/students/:id', getUpdateHandler('users'));
router.get('/students/:id', getDetailHandler('users'));
router.delete('/students/:id', getDeleteAccountForUserHandler, getDeleteHandler('users'));

router.all('/students', function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/users', {
        qs: {
            roles: ['student'],
            $populate: ['roles'],
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1)
        }
    }).then(data => {
        const head = [
            'Vorname',
            'Nachname',
            'E-Mail-Adresse',
            ''
        ];

        const body = data.data.map(item => {
            return [
                item.firstName,
                item.lastName,
                item.email,
                getTableActions(item, '/administration/students/')
            ];
        });

        const pagination = {
            currentPage,
            numPages: Math.ceil(data.total / itemsPerPage),
            baseUrl: '/administration/students/?p={{page}}'
        };

        res.render('administration/students', {title: 'Administration: Schüler', head, body, pagination});
    });
});

router.post('/systems/', createSystemHandler);
router.patch('/systems/:id', getUpdateHandler('systems'));
router.get('/systems/:id', getDetailHandler('systems'));
router.delete('/systems/:id', removeSystemFromSchoolHandler, getDeleteHandler('systems'));

router.all('/systems', function (req, res, next) {

    api(req).get('/schools/' + res.locals.currentSchool, {
        qs: {
            $populate: ['systems'],
        }
    }).then(data => {
        const head = [
            'Name',
            'Typ',
            'Url',
            ''
        ];

        let systems = data.systems.filter(system => system.type != 'local');

        const body = systems.map(item => {
            let name = getSSOTypes().filter(type => item.type === type.value);
            return [
                item.alias,
                name,
                item.url,
                getTableActions(item, '/administration/systems/')
            ];
        });

        const availableSSOTypes = getSSOTypes();

        res.render('administration/systems', {
            title: 'Administration: Authentifizierungsdienste',
            head,
            body,
            systems,
            availableSSOTypes
        });
    });
});


module.exports = router;
