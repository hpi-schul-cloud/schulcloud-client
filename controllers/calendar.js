/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const moment = require("moment");
const recurringEventsHelper = require('../helpers/recurringEvents');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.get('/', function (req, res, next) {
    res.render('calendar/calendar', {
        title: 'Kalender',
        userId: res.locals.currentUser._id
    });
});

router.get('/events/', function (req, res, next) {
    api(req).get('/calendar/', {
        qs: {
            all: true
        }
    }).then(events => {
        Promise.all(events.map(event => recurringEventsHelper.mapEventProps(event, req))).then(events => {
            events = [].concat.apply([], events.map(recurringEventsHelper.mapRecurringEvent));
            return res.json(events);
        });
    }).catch(err => {
        res.json([]);
    });
});

router.post('/events/', function (req, res, next) {
    req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();
    req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();

    if (req.body.courseId && req.body.courseId !== '') {
        req.body.scopeId = req.body.courseId;
    } else {
        delete req.body.courseId;
    }

    if (req.body.teamId && req.body.teamId !== '') {
        req.body.scopeId = req.body.teamId;
    } else {
        delete req.body.teamId;
    }

    api(req).post('/calendar/', {json: req.body}).then(event => {
        res.redirect('/calendar');
    }).catch(next);
});

router.delete('/events/:eventId', function (req, res, next) {
   api(req).delete('/calendar/' + req.params.eventId).then(_ => {
       res.json(_);
   }).catch(err => {
       next(err);
   });
});

router.put('/events/:eventId', function (req, res, next) {
    req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();
    req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();

    api(req).put('/calendar/' + req.params.eventId, {
        json: req.body
    }).then(_ => {

        res.redirect('/calendar/');
    }).catch(err => {
        next(err);
    });
});

module.exports = router;
