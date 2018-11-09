
const express = require('express');
const router = express.Router();
const api = require('../api');

const sendMailHandler = (req, res, next) => {
    api(req).get('/accounts/' + res.locals.result.account, { qs: { $populate: ['userId']}})
        .then((account) => {
            let content = {
                "text": "Sehr geehrte/r " + account.userId.firstName + " " + account.userId.lastName + "\n\n" +
                "Bitte setzen Sie Ihr Passwort unter folgendem Link zurück:\n" +
                (req.headers.origin || process.env.HOST) + "/pwrecovery/" + res.locals.result._id + "\n\n" +
                "Mit Freundlichen Grüßen" + "\nIhr Schul-Cloud Team"
            };
            req.body.content = content;
            api(req).post('/mails', {
                json: {
                    headers: {},
                    email: account.userId.email,
                    subject: `Passwort zurücksetzen für die ${res.locals.theme.short_title}`,
                    content: content
                }
            }).then(_ => {
                res.redirect('/login/');
            }).catch(err => {
                res.status((err.statusCode || 500)).send(err);
            });
        });
};

const obscure_email = (email) => {
    let parts = email.split("@");
    let name = parts[0];
    let result = name.charAt(0);
    for(var i=1; i<name.length; i++) {
        result += "*";
    }
    result += name.charAt(name.length - 1);
    result += "@";
    let domain = parts[1];
    result += domain.charAt(0);
    let dot = domain.indexOf(".");
    for(var j=1; j<dot; j++) {
        result += "*";
    }
    result += domain.substring(dot);

    return result;
};

router.get('/error', function (req, res, next) {
    res.render('pwRecovery/pwRecoveryError');
});

router.get('/:pwId', function (req, res, next) {
    api(req).get('/passwordRecovery/' + req.params.pwId, { qs: { $populate: ['account']}}).then(result => {
        if(result.changed) {
            let error = new Error('Ihr Passwort wurde bereits über diese URL geändert.');
            error.status = 400;
            return next(error);
        }
        if((Date.now() - Date.parse(result.createdAt)) >= 86400000) {
            let error = new Error('Zeit abgelaufen für Passwort Recovery.');
            error.status = 400;
            return next(error);
        }
        res.render('pwRecovery/pwrecovery', {
            title: 'Passwort Recovery',
            subtitle: obscure_email(result.account.username),
            accountId: result.account._id,
            resetId: req.params.pwId,
            action: '/pwrecovery/reset/',
            buttonLabel: 'Neues Passwort anlegen',
            inline: true
        });
    });
});

router.post('/', function (req, res, next) {
    let username = req.body.username.toLowerCase();
    api(req).post('/passwordRecovery', {json: {username: username}}).then((result) => {
        res.locals.result = result;
        next();
    }).catch(err => {
        res.redirect('error');
        next(err);
    });
}, sendMailHandler);

router.post('/reset', function (req, res, next) {
    api(req).post('/passwordRecovery/reset', {json: req.body}).then(_ => {
        res.redirect('/login/');
    }).catch(err => {
        next(err);
    });
});



module.exports = router;
