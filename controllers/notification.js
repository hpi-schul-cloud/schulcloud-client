const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

// secure routes
router.use(authHelper.authChecker);

const postRequest = (req, res, next) => {
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        api(req).post(res.locals.url, {
            body: res.locals.body
        }).then((response) => {
            res.json(response);
        }).catch(err => {
            res.status(err.statusCode).send(err.message);
        });
    }else{
        res.status(500).send('notification service not enabled');
    }
};

router.delete('/device', function (req,res,next){
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        api(req).delete('notification/devices/' + req.body._id)
        .then(_ => res.json(_)).catch(err=> res.json(err));
    }
});

router.post('/devices', function (req, res, next) {
    res.locals.url = 'notification/devices';
    res.locals.body = {
        "type": req.body.type ? req.body.type : "mobile",
        "name": req.body.name ? req.body.name : "Gerät",
        "userId": res.locals.currentUser._id,
        "token": req.body.id,
        "OS": req.body.device ? req.body.device : "android7"
    };

    next();
}, postRequest);

router.post('/callback', function (req, res, next) {
   res.locals.url = 'notification/callback';
   res.locals.body = req.body;

   next();
}, postRequest);

router.post('/message', function (req, res, next) {
    res.locals.url = 'notification/messages';
    res.locals.body = req.body;

    next();
}, postRequest);

router.post('/push/test', function (req, res, next) {
    let userId = res.locals.currentUser._id;
    res.locals.url = 'notification/push';
    res.locals.body = {
        data: {
            tag: 'test-notification'
        },
        receivers: [userId],
        template: 'tpl',
        languagePayloads: 'lp'
    };
    next();
}, postRequest);

module.exports = router;
