const express = require('express');
const router = express.Router();
const api = require('../api');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {
    let user = res.locals.currentUser;
    let currentLocation = req.get('Referrer');
    let email = user.email ? user.email : req.body.modalEmail;
    let content = {
        "text": "User: " + user.displayName + "\n"
        + "E-Mail: " + email + "\n"
        + "Schule: " + res.locals.currentSchoolData.name + "\n"
        + "Feedback geschickt von: " + currentLocation + "\n"
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
});

module.exports = router;
