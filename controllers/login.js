/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const api = require('../api');
const feedr = require('feedr').create();
const authHelper = require('../helpers/authentication');


const getSelectOptions = (req, service, query) => {
    return api(req).get('/' + service, {
        qs: query
    }).then(data => {
        return data.data;
    });
};


// Login

router.post('/login/', function (req, res, next) {
    const username = req.body.username; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize
    const systemId = req.body.systemId;

    return api(req).get('/accounts/', {qs: {username: username}})
        .then(account => {
            if (!(account[0] || {}).activated && (account[0] || {}).activated !== undefined) { // undefined for currently existing users
                res.locals.notification = {
                    'type': 'danger',
                    'message': 'Account noch nicht aktiviert.'
                };
                next();
            } else {
                const login = (data) => {
                    return api(req).post('/authentication', {json: data}).then(data => {
                        res.cookie('jwt', data.accessToken, {expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)});
                        res.redirect('/login/success/');
                    }).catch(_ => {
                        res.locals.notification = {
                            'type': 'danger',
                            'message': 'Login fehlgeschlagen.'
                        };
                        next();
                    });
                };

                if (systemId) {
                    return api(req).get('/systems/' + req.body.systemId).then(system => {
                        return login({strategy: system.type, username, password, systemId});
                    });
                } else {
                    return login({strategy: 'local', username, password});
                }
            }
        });
});


router.all('/', function (req, res, next) {
    authHelper.isAuthenticated(req).then(isAuthenticated => {
        if (isAuthenticated) {
            return res.redirect('/login/success/');
        } else {
            feedr.readFeed('https://blog.schul-cloud.org/rss', {
                requestOptions: {timeout:2000}
            }, function (err, data, headers) {
                let blogFeed = [];
                try {
                    blogFeed = data.rss.channel[0].item.slice(0, 5).map(function (e) {
                        let date = new Date(e.pubDate),
                            locale = "en-us",
                            month = date.toLocaleString(locale, {month: "long"});
                        e.pubDate = date.getDate() + ". " + month;
                        return e;
                    });
                } catch(e) {
                    // just catching the blog-error
                }

                let schoolsPromise = getSelectOptions(req, 'schools');
                Promise.all([
                    schoolsPromise
                ]).then(([schools, systems]) => {
                    return res.render('authentication/home', {
                        schools,
                        blogFeed,
                        inline: true,
                        systems: []
                    });
                });
            });
        }
    });
});

router.all('/login/', function (req, res, next) {
    authHelper.isAuthenticated(req).then(isAuthenticated => {
        if (isAuthenticated) {
            return res.redirect('/login/success/');
        } else {
            let schoolsPromise = getSelectOptions(req, 'schools');

            Promise.all([
                schoolsPromise
            ]).then(([schools, systems]) => {
                return res.render('authentication/login', {
                    schools,
                    inline: true,
                    systems: []
                });
            });
        }
    });
});

// so we can do proper redirecting and stuff :)
router.get('/login/success', authHelper.authChecker, function (req, res, next) {
    if (res.locals.currentUser) {
        const user = res.locals.currentUser;

        api(req).get('/consents/', {qs: { userId: user._id }})
            .then(consents => {
                consent = consents.data[0];

                res.redirect(consent.redirect);
            })
            .catch(err => {
                // user has no consent; redirect for now
                res.redirect('/dashboard/');
            });
    } else {
        // if this happens: SSO
        res.redirect('/register/user/' + res.locals.currentPayload.accountId);
    }
});

router.get('/login/systems/:schoolId', function (req, res, next) {
    return api(req).get('/schools/' + req.params.schoolId, {
        qs: {$populate: ['systems']}
    }).then(data => {
        return res.send(data.systems);
    });
});

router.get('/logout/', function (req, res, next) {
    api(req).del('/authentication')
        .then(_ => {
            res.clearCookie('jwt');
            return res.redirect('/');
        }).catch(_ => {
        return res.redirect('/');
    });
});

module.exports = router;
