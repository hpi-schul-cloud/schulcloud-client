const express = require('express');

const url = require('url');
const crypto = require('crypto');
const ipaddr = require('ipaddr.js');

const api = require('../api');
const helper = require('../helpers/googleAnalytics');

const logger = require('../helpers/logger');

logger.info('Google Analytics Tracking ID: ' + process.env.SW_GOOGLE_ANALYTICS_TRACKING_ID);

const router = express.Router();

router.use(require('../helpers/authentication').authChecker);

/**
 * replaces id occurences of given url.
 * may result in false positives if url slugs have a length of 24 characters
 * @param {string} url 
 */
function idCleanup(url){
    const match = /\/[0-9a-f]{24}/g;
    if(url.match(match)){
        return url.replace(match,'/ID');
    }
    return url;
}

// removes query string and anchor from url
function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
  }

router.post('/', function (req, res, next) {
    const userRoles = res.locals.currentUser.roles.map(r => r.name);
    const isDemoUser = userRoles.some(r => r.startsWith('demo'));
    let data = req.body;
    let context = data.attributes.context;
    data.attributes.url = getPathFromUrl(idCleanup(data.attributes.url));
    let dataUrl = url.parse(data.attributes.url);
    let hit = {
        tid: process.env.SW_GOOGLE_ANALYTICS_TRACKING_ID, // Tracking ID
        cid: crypto.createHash('sha256').update(req.sessionID).digest('base64'), // User ID
        t: 'pageview', // hit type
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
        cm6: context['downlink'], // download speed in mbit/s
        cm7: context['request-start'],
        cm8: context['response-start'],
        cm9: context['response-end'],
        
        cd1: context['connection'], // connection type http://wicg.github.io/netinfo/ 
        cd2: data.attributes.url.includes('localhost') ? 'local' : 'default',
        cd3: req.headers['sw-offline'] === 'true' ? true : false,
        cd4: req.headers['sw-enabled'] === 'true' ? true : false,
        cd5: res.locals.currentSchool,
        cd6: context['networkProtocol'], // http1.1 / http2 / unknown
    };
    if (!isDemoUser){
        api(req).post('/analytics', { json: hit }).then(result => {
            res.send(result);
        }).catch(_ => {
            res.send('error');
        });
    }else{
        //no logging for demo users
    }
});

module.exports = router;
