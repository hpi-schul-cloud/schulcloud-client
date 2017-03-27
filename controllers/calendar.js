/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.get('/', function (req, res, next) {
    res.render('calendar/calendar', {
        title: 'Kalender'
    });
});

router.get('/events/', function (req, res, next) {
    api(req).get('/calendar/').then(events => {
        return res.json(events);
    }).catch(err => {
        res.json([]);
    });
});

module.exports = router;
