const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const postRequest = (req, res, next) => {
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        api(req).post(res.locals.url, {
            body: res.locals.body
        }).then((response) => {
            res.json(response);
        });
    } else {
        res.status(423).send('notification service has been disabled');
    }
};

router.post('/devices', authHelper.authChecker, function (req, res, next) {
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

router.get('/callback/:messageId/seenBy/:receiverId/', function (req, res, next) {

    const sendClientResponse = (response) => {
        if (response && response.redirect && response.redirect !== null) {
            return res.redirect(response.redirect);
        } else {
            return res.redirect('/');
        }
    }

    res.locals.url = 'notification/callback';
    res.locals.body = {
        messageId: req.params.messageId,
        receiverId: req.params.receiverId,
        redirect: req.query.redirect || null
    };
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        api(req).post(res.locals.url, {
            body: res.locals.body
        }).then((response) => {
            return sendClientResponse(response);
        }).catch(err => {
            logger.error('could not mark message as read', err);
            return sendClientResponse();
        });
    } else {
        logger.error('could not mark message as read because notification service was disabled, redirect');
        return sendClientResponse();
    }
});

router.post('/message', authHelper.authChecker, function (req, res, next) {
    res.locals.url = 'notification/messages';
    res.locals.body = req.body;

    next();
}, postRequest);

module.exports = router;
