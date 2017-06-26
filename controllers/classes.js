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
 * sets undefined array-class properties to an empty array
 */
const mapEmptyClassProps = (req, res, next) => {
    let classBody = req.body;
    if (!classBody.teacherIds) classBody.teacherIds = [];
    if (!classBody.userIds) classBody.userIds = [];
    next();
};

// secure routes
router.use(authHelper.authChecker);


/*
 * Classes
 */


router.get('/', function (req, res, next) {
    api(req).get('/classes/', {
        qs: {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id}
            ]
        }
    }).then(classes => {

        const teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher']});
        const studentsPromise = getSelectOptions(req, 'users', {roles: ['student']});

        Promise.all([
            teachersPromise,
            studentsPromise
        ]).then(([teachers, students]) => {

            res.render('classes/overview', {
                title: 'Meine Klassen',
                classes,
                teachers,
                students
            });
        });
    });
});

router.get('/teachers/', function (req, res, next) {
    const teachersPromise = getSelectOptions(req, 'users', {roles: ['teacher']});
    teachersPromise.then(teachers => {
        // preselect current teacher when creating new class
        teachers.forEach(t => {
            if (JSON.stringify(t._id) === JSON.stringify(res.locals.currentUser._id)) t.selected = true;
        });

        res.json(teachers);
    })
});

router.get('/:classId/', function (req, res, next) {
    api(req).get('/classes/' + req.params.classId).then(data => res.json(data))
        .catch(err => {
            next(err);
        });
});

router.post('/', function (req, res, next) {
    api(req).post('/classes/', {
        // TODO: sanitize
        json: req.body
    }).then(data => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
});

router.delete('/:classId/', function (req, res, next) {
    api(req).delete('/classes/' + req.params.classId).then(_ => {
        res.sendStatus(200);
    }).catch(_ => {
        res.sendStatus(500);
    });
});

router.patch('/:classId/', mapEmptyClassProps, function (req, res, next) {
    api(req).patch('/classes/' + req.params.classId, {
        // TODO: sanitize
        json: req.body
    }).then(data => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
});

module.exports = router;
