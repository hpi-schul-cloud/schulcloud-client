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


const getCreateHandler = (service) => {
    return function (req, res, next) {
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.locals.createdTeacher = data;
            next();
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
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};


const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
            res.json(data);
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
    })
};

const createSystemHandler = (req, res, next) => {
    api(req).post('/systems/', { json: req.body }).then(system => {
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
    ]
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
    let createdTeacher = res.locals.createdTeacher;
    let email = createdTeacher.email;
    fs.readFile(path.join(__dirname, '../views/template/registration.hbs'), (err, data) => {
       if(!err){
           let source = data.toString();
           let template = handlebars.compile(source);
           let outputString = template({
               "url":req.headers.origin + "/register/account/" + createdTeacher._id,
               "firstName": createdTeacher.firstName,
               "lastName": createdTeacher.lastName
           });

           let content = {
               "html": outputString,
               "text": "Sehr geehrte/r " + createdTeacher.firstName + " " + createdTeacher.lastName + ",\n\n" +
               "Sie wurden in die Schul-Cloud eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
               req.headers.origin + "/register/account/" + createdTeacher._id + "\n\n" +
               "Mit Freundlichen Grüßen" + "\n Ihr Schul-Cloud Team"
           };
           req.body.content = content;
           api(req).post('/mails', {json:{
               headers: {},
               email: email,
               subject: "Einladung in die Schul-Cloud",
               content: content
           }}).then(_ => {
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


router.post('/courses/', getCreateHandler('courses'));
router.patch('/courses/:id', getUpdateHandler('courses'));
router.get('/courses/:id', getDetailHandler('courses'));
router.delete('/courses/:id', getDeleteHandler('courses'));

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
router.delete('/teachers/:id', getDeleteHandler('users'));

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


router.post('/students/', getCreateHandler('users'));
router.patch('/students/:id', getUpdateHandler('users'));
router.get('/students/:id', getDetailHandler('users'));
router.delete('/students/:id', getDeleteHandler('users'));

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
router.delete('/systems/:id', removeSystemFromSchoolHandler , getDeleteHandler('systems'));

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
