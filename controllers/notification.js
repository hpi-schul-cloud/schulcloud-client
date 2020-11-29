const express = require('express');
const router = express.Router();
const { api } = require('../api');
const authHelper = require('../helpers/authentication');

const { NOTIFICATION_SERVICE_ENABLED } = require('../config/global');

// secure routes
router.use(authHelper.authChecker);

const postRequest = (req, res, next) => {
	if (NOTIFICATION_SERVICE_ENABLED) {
        api(req).post(res.locals.url, {
            body: res.locals.body
        }).then((response) => {
            res.json(response);
        });
    }
};

router.post('/devices', function (req, res, next) {
    res.locals.url = 'notification/devices';
    res.locals.body = {
        "service": req.body.service ? req.body.service : "firebase",
        "type": req.body.type ? req.body.type : "mobile",
        "name": req.body.name ? req.body.name : "Gerät",
        "token": res.locals.currentUser._id,
        "device_token": req.body.id,
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

module.exports = router;
