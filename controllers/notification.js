const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

// secure routes
router.use(authHelper.authChecker);

const postRequest = (req, res, next) => {
    api(req).post(res.locals.url, {
        body: res.locals.body
    }).then((response) => {
        res.json(response);
    });
};

router.post('/devices', function (req, res, next) {
    res.locals.url = 'notification/devices';
    res.locals.body = {
        "service": req.body.service ? req.body.service : "firebase",
        "type": "mobile",
        "name": "test2",
        "token": res.locals.currentUser._id,
        "device_token": req.body.id,
        "OS": req.body.device ? req.body.device : "android7"
    };

    next();
}, postRequest);

router.post('/callback', function (req, res, next) {
   res.locals.url = 'notification/callback';
   res.locals.body = req.body.body;

   next();
}, postRequest);

module.exports = router;
