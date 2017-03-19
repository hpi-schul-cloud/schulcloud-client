/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');


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


// secure routes
router.use(authHelper.authChecker);
router.use(permissionsHelper.permissionsChecker('ADMIN_VIEW'));


router.patch('/schools/:id', getUpdateHandler('schools'));

router.all('/', function (req, res, next) {
    api(req).get('/schools/' + res.locals.currentSchool).then(data => {
        res.render('administration/school', {title: 'Administration: Allgemein', school: data});
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

            res.render('administration/courses', {title: 'Administration: Kurse', head, body, classes, teachers, students, pagination});
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

            res.render('administration/classes', {title: 'Administration: Klassen', head, body, teachers, students, pagination});
        });
    });
});


router.post('/teachers/', getCreateHandler('users'));
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


module.exports = router;
