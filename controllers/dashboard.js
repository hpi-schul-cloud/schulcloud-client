/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    api(req).get('/news/', {
    }).then(news => {
        news = news.data.map(news => {

            news.url = '/news/' + news._id;

            function formattimepart(s) {
                return (s < 10) ? "0" + s : s;
            }

            var dateRaw = new Date(news.displayAt);
            var date = new Date(dateRaw.getTime());
            var dateF = formattimepart(date.getDate()) + "." + formattimepart(date.getMonth() + 1) + "." + date.getFullYear();
            var timeF = formattimepart(date.getHours()) + ":" + formattimepart(date.getMinutes());

            var now = new Date();
            var past = (now - date);
            var pastDays = Math.floor(past / (1000 * 60 * 60 * 24));
            var pastHours = Math.floor((past % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var pastMinutes = Math.floor(((past % (1000 * 60 * 60 * 24)) % (1000 * 60 * 60)) / (1000 * 60));
            var pastString;
            if (pastDays > 5 || past < 0) {
                pastString = (dateF + " (" + timeF + ")")
            }
            else if (pastDays > 1) {
                pastString = "vor " + pastDays + " Tagen"
            }
            else if (pastDays == 1) {
                pastString = "vor 1 Tag " + pastHours + ((pastHours == 1) ? " Stunde" : " Stunden")
            }
            else if (pastHours > 2) {
                pastString = "vor " + pastHours + " Stunden"
            }
            else if (pastHours >= 1) {
                pastString = "vor " + pastHours + ((pastHours == 1) ? " Stunde " : " Stunden ") + pastMinutes + ((pastMinutes == 1) ? " Minute" : " Minuten")
            }
            else {
                pastString = "vor " + pastMinutes + ((pastMinutes == 1) ? " Minute" : " Minuten")
            }

            news.timeString = pastString;
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

        news = news.sort(sortFunction).slice(0,4);
        res.render('dashboard/dashboard', {title: 'Übersicht', news});
    });
});


module.exports = router;
