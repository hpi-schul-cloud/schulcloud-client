const express = require('express');
const router = express.Router();
const api = require('../api');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {

    if (req.body.type === 'feedback') { //case: schulcloud feedback
        let user = res.locals.currentUser;
        let email = user.email ? user.email : "";
        let innerText = "Bereich ausgewählt: " + req.body.category + "\n";
        let content = {
            "text": "User: " + user.displayName + "\n"
            + "E-Mail: " + email + "\n"
            + "Schule: " + res.locals.currentSchoolData.name + "\n"
            + innerText
            + "User schrieb folgendes: \n" + req.body.content.text
        };
        req.body.content = content;
        req.body.headers = {
            "X-Zammad-Customer-Email": email
        };
        api(req).post('/mails', {json: req.body}).then(_ => {
            res.sendStatus(200);
        }).catch(err => {
            res.status((err.statusCode || 500)).send(err);
        });
    } else { //case: admin
        api(req).post('/helpdesk', {
            json: {
                subject: req.body.subject,
                category: req.body.category,
                currentState : req.body.currentState,
                targetState: req.body.targetState,
                userId: res.locals.currentUser._id,
                schoolId: res.locals.currentSchoolData._id,
                cloud: res.locals.theme.title
            }
        }).then(_ => {
            api(req).get('/users', {qs: { roles: ['helpdesk']}})
            .then(data => {
                data.data.map(user => {
                    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
                        api(req).post('/notification/messages', {
                            json: {
                                "title": "Ein neues Problem wurde gemeldet.",
                                "body": "",
                                "token": user._id,
                                "priority": "high",
                                "action": `${(req.headers.origin || process.env.HOST)}/administration/helpdesk`,
                                "scopeIds": [
                                    user._id
                                ]
                            }
                        });
                    }
                });
            });
            res.sendStatus(200);
        }).catch(err => {
            res.status((err.statusCode || 500)).send(err);
        });
    }
});

module.exports = router;
