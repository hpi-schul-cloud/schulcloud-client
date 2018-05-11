const express = require('express');
const router = express.Router();
const api = require('../api');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');


// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {

    //TODO: What does feedback do?
    if (req.body.type === 'feedback') {
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
        //TODO: Remove Zammad completely from everywhere
        req.body.headers = {
            "X-Zammad-Customer-Email": email
        };
        api(req).post('/mails', {json: req.body}).then(_ => {
            res.sendStatus(200);
        }).catch(err => {
            res.status((err.statusCode || 500)).send(err);
        });
    } else {
        api(req).post('/helpdesk', {
            json: {
                subject: req.body.subject,
                category: req.body.category,
                currentState : req.body.currentState,
                targetState: req.body.targetState,
                userId: res.locals.currentUser._id,
                schoolId: res.locals.currentSchoolData._id
            }
        }).then(_ => {
            api(req).get('/users', {
                qs: { roles: ['helpdesk', 'administrator'], $populate: ['roles'] }
            }).then(data => {
                data.data.map(user => {
                    if (res.locals.currentSchoolData._id === user.schoolId) {
                        let infoHtml, content;
                        //TODO: html mail template not working yet, text mail gets send, fix it
                        fs.readFile(path.join(__dirname, '../views/template/mail_new-problem.hbs'), (err, data) => {
                            if(!err) {
                                let source = data.toString();
                                let template = handlebars.compile(source);
                                infoHtml = template({
                                    "url": "abcdef",
                                    "firstName": res.locals.currentUser.firstName,
                                    "lastName": res.locals.currentUser.lastName
                                });
                            }
                        });
                        let infoText = "Ein neues Problem wurde gemeldet." + "\n"
                            + "User: " + res.locals.currentUser.email + "\n"
                            + "Kategorie: " + req.body.category + "\n"
                            + "Betreff: " + req.body.subject + "\n"
                            + "Schauen Sie für weitere Details und zur Bearbeitung bitte in das Helpdesk der Schul-Cloud.\n\n"
                            + "Mit Freundlichen Grüßen\nIhr Schul-Cloud Team";
                        if (infoHtml) {
                            content = { "text": infoText, "html": infoHtml };
                        } else {
                            content = { "text": infoText };
                        }
                        api(req).post('/mails', {
                            json: {
                                headers: {},
                                email: user.email,
                                subject: "Ein neues Problem wurde gemeldet.",
                                content: content
                            }
                        });
                    }
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