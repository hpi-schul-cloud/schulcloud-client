const express = require('express');
const router = express.Router();

const url = require('url');
const crypto = require('crypto');
const ipaddr = require('ipaddr.js');

const api = require('../api');
const helper = require('../helpers/googleAnalytics');

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

logger.info('Google Analytics Tracking ID: ', process.env.GOOGLE_ANALYTICS_TRACKING_ID);

router.post('/', function (req, res, next) {
    let data = req.body;
    let context = data.attributes.context;
    let dataUrl = url.parse(data.attributes.url);
    let hit = {
        tid: process.env.GOOGLE_ANALYTICS_TRACKING_ID, // Tracking ID
        cid: crypto.createHash('sha256').update(req.sessionID).digest('base64'), // User ID
        t: 'pageview', // hit type
        v: 1, // version
        uip: helper.anonymizeIp(req.ip), // IP override
        geoid: helper.getGeoId(req.ip), // Geographical override

        qt: data.attributes['qt'], // queue time (integer)
        dl: data.attributes.url, // document location
        dp: dataUrl.path, // document path

        swEnabled: req.headers['sw-enabled'] === "true" ? true : false,

        cm1: context['first-paint'], // cm1 is first paint ms
        cm2: context['time-to-interactive'], // cm2 is time to interactive ms
        cm3: context['page-loaded'], // page load time ms
        cm4: context['dom-interactive-time'], // dom interactive time ms
        cm5: context['dom-content-loaded'], // content load time ms
        cm6: context['downlink'], // download speed in mbit/s

        cd1: context['connection'], // connection type http://wicg.github.io/netinfo/ 
        cd2: data.attributes.url.includes('localhost') ? 'local' : 'default'
    };
    api(req).post('/statistics', { json: hit }).then(result => {
        res.send(result);
    }).catch(_ => {
        res.send('error');
    });
});

module.exports = router;
