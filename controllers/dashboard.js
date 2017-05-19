/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const moment = require("moment");

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    api(req).get('/news/', {
    }).then(news => {
        news = news.data.map(news => {
            news.url = '/news/' + news._id;
            news.timeString = moment(news.displayAt).fromNow();
            return news;
        });
        function sortFunction(a, b) {
            if (a.displayAt === b.displayAt) {
                return 0;
            }
            else {
                return (a.displayAt < b.displayAt) ? 1 : -1;
            }
        }

        news = news.sort(sortFunction).slice(0,3);
        res.render('dashboard/dashboard', {title: 'Übersicht', news});
    });
});


module.exports = router;
