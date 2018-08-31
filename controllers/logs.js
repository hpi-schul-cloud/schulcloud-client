const express = require('express');
const router = express.Router();

const url = require('url');
const crypto = require('crypto');
const ipaddr = require('ipaddr.js');

const api = require('../api');
const helper = require('../helpers/googleAnalytics');

router.post('/', function (req, res, next) {
    let data = req.body;
    let context = data.attributes.context;
    let dataUrl = url.parse(data.attributes.url);
    let hit = {
        tid: process.env.GOOGLE_ANALYTICS_TRACKING_ID , // Tracking ID
        cid: crypto.createHash('sha256').update(req.sessionID).digest('base64'), // User ID
        t: 'pageview', // hit type
        ds: 'web', // datasource
        v: 1, // version
        uip: helper.anonymizeIp(req.ip), // IP override
        geoid: helper.getGeoId(req.ip), // Geographical override

        qt: data.attributes['qt'], // queue time (integer)
        dl: data.attributes.url, // document location
        dp: dataUrl.path, // document path

        cm1: context['first-paint'], // cm1 is first paint ms
        cm2: context['time-to-interactive'], // cm2 is time to interactive ms
        cm3: context['page-loaded'], // page load time ms
        cm4: context['dom-interactive-time'], // dom interactive time ms
        cm5: context['dom-content-loaded'], // content load time ms
    };
    api(req).post('/statistics', { json: hit }).then(result => {
        res.send(result);
    }).catch(error => {
        res.statusCode = error.statusCode;
        res.send(error.error.name);
    });
});

module.exports = router;
