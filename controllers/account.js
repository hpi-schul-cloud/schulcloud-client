const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const rp = require('request-promise');

// secure routes
router.use(authHelper.authChecker);

router.post('/', function (req, res, next) {
    const {firstName, lastName, email, password, password_new, gender} = req.body; // TODO: sanitize
        let finalGender;
        (gender === '' || !gender) ? finalGender = null : finalGender = gender;
        return api(req).patch('/accounts/' + res.locals.currentPayload.accountId, {
            json: {
                password_verification: password,
                password: password_new !== '' ? password_new : undefined
            }
        }).then(() => {
            return api(req).patch('/users/' + res.locals.currentUser._id, {json: {
                firstName,
                lastName,
                email,
                gender: finalGender
            }}).then(authHelper.populateCurrentUser.bind(this, req, res)).then(_ => {
                res.redirect('/account/');
            });
        }).catch((err) => {
            res.render('account/settings', {title: 'Dein Account', notification: {
                type: 'danger',
                message: err.error.message
            }});
        });
});

router.get('/', function (req, res, next) {
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        api(req).get('/notification/devices')
            .then(device => {
                device.map(d => {
                    if (d.token === req.cookies.deviceToken) {
                        Object.assign(d, {selected: true});
                    }
                    return d;
                });
                res.render('account/settings', {
                    title: 'Dein Account',
                    device,
                    userId: res.locals.currentUser._id
                });
            }).catch(err => {
            res.render('account/settings', {
                title: 'Dein Account',
                userId: res.locals.currentUser._id
            });
        });
    } else {
        res.render('account/settings', {
            title: 'Dein Account',
            userId: res.locals.currentUser._id
        });
    }
});

router.get('/profile', function (req, res, next) {
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        console.log("profile with NOTIFICATION_SERVICE_ENABLED");
        api(req).get('/notification/devices')
            .then(device => {
                device.map(d => {
                    if (d.token === req.cookies.deviceToken) {
                        Object.assign(d, {selected: true});
                    }
                    return d;
                });
                res.render('account/profile', {
                    title: 'Dein Account',
                    device,
                    userId: res.locals.currentUser._id
                });
            }).catch(err => {
            res.render('account/profile', {
                title: 'Dein Account',
                userId: res.locals.currentUser._id
            });
        });
    } else {
        console.log("profile request");
        var url = 'http://localhost:3131/user/' + res.locals.currentUser._id;
        rp.get(url)
          .then(userInfo => {
            let possibleBadges = [ // list of badges that a user hasn't achieved yet but could in the future
              {
                name: 'Klassenliebling',
                actions: { xp: 50 },
                description: 'Überragend! Du hast drei Inhalte veröffentlicht und bist damit zum Klassenliebling aufgestiegen. Dafür gibt es 50 XP.'
              },
              {
                name: 'Verleger',
                actions: { xp: 100 },
                description: 'Herrausragende Leistung! Zehn veröffentlichte Inhalte. Ab jetzt müssen die Kolleg*Innen dich Verleger nennen. Nimm dafür weitere 100 XP.'
              },
              {
                name: 'Held-des-Kollegiums-Bronze',
                actions: { xp: 20 },
                description: 'Einer Deiner Inhalte wurde akzeptiert. Das Kollegium dankt! 20 Punkte Bonus für Dein Konto.'
              },
              {
                name: 'Held-des-Kollegiums-Silber',
                actions: { xp: 50 },
                description: 'Drei Deiner Werke sind veröffentlicht und für das Kollegium nutzbar. Nimm dafür weitere 50 XP.'
              },
              {
                name: 'Held-des-Kollegiums-Silber',
                actions: { xp: 100 },
                description: 'Mit Deinen zehn veröffentlichten Inhalten leistest Du  einen riesigen Beitrag für die Unterrichtsqualität. Das Kollegium dankt es mit 100 XP.'
              }
            ]; // TODO: Implement this in gamification service
            userInfo = JSON.parse(userInfo);
            userInfo.xp = [
              {
                name: "XP",
                amount: "150"
              },
              {
                name: "Lehrer-Punkte",
                amount: "10"
              }
            ];
            userInfo.level = 2;
            userInfo.achievements = [
              {
                name: 'Inhaltsersteller',
                actions: { xp: 5 },
                description: 'Der erste Inhalt ist erstellt. Klasse! Wenn Du einen Inhalt mit Kolleg*Innen teilst, bekommst du eine weitere Badge und andere zusätzliche Vorteile.'
              },
              {
                name: 'Inhaltsteiler',
                actions: { xp: 10 },
                description: 'Der erste Inhalt ist geteilt. Hoffentlich gefällt er den Kolleg*Innen. Weiter so! Zur Belohnung gibt es 10 XP.'
              }
            ]; // TODO: Only in here for testing purposes. Remove overriding of userInfo before rollout
            res.render('account/profile', {
              userId: res.locals.currentUser._id,
              userInfo, //: JSON.parse(userInfo),
              possibleBadges
            });
          })
    }
});

// delete file
router.delete('/settings/device', function (req, res, next) {
    const {name, _id = ''} = req.body;

    api(req).delete('/notification/devices/' + _id).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});

router.get('/user', function (req, res, next) {
    res.locals.currentUser.schoolName = res.locals.currentSchoolData.name;
    res.json(res.locals.currentUser);
});

router.post('/preferences', (req, res, next) => {
    const {attribute} = req.body;

    return api(req).patch('/users/' + res.locals.currentUser._id, {
        json: {["preferences." + attribute.key] : attribute.value}
    }).then(() => {
        return "Präferenzen wurden aktualisiert!";
    }).catch((err) => {
        return "Es ist ein Fehler bei den Präferenzen aufgetreten!";
    });
});

module.exports = router;
