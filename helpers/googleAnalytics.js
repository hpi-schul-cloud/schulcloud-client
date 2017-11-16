/* eslint-disable no-console */
const url = require('url');
const crypto = require('crypto');
const Request = require('request-promise');
const ipaddr = require('ipaddr.js');
const queryString = require('query-string');

const SOCKET_POOL_SIZE = 32;
const MAX_BATCH_SIZE = 10;
const MAX_QUEUE_TIME = 60 * 60 * 1000;
const FALLBACK_HOST = 'https://schul-cloud.org';
const BATCH_HITS_ENDPOINT = 'https://www.google-analytics.com/batch';

let queue = [];
let flushTimer = [];
const request = Request.defaults({
  forever: true,
  pool: {maxSockets: SOCKET_POOL_SIZE}
});

const emit = (hit) => {
  queue.push(hit);
  if(queue.length === MAX_BATCH_SIZE) {
    flush();
  } else {
    // Schedules flush if no event is triggered within MAX_QUEUE_TIME
    flushTimer = setTimeout(() => flush(), MAX_QUEUE_TIME);
  }
};

const flush = () => {
  if(flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if(queue.length === 0) {
    return;
  }

  let now = Date.now();
  let body = queue.map(hit => {
    // Adapts queue time parameter to the moment the hit is emitted
    hit.qt = Math.round((now - hit.qt) / 1000);
    return queryString.stringify(hit);
  }).join('\r\n');
  queue = [];

  request({
    method: 'POST',
    uri: BATCH_HITS_ENDPOINT,
    encoding: 'utf-8',
    body,
  }).catch(err => console.error(`Error while emitting Google Analytics hits (${err.message})`));
};

const anonymizeIp = (ip) => {
  ip = ipaddr.parse(ip);
  let bytes;
  if(ip.kind() === 'ipv4') {
    // Sets last 8bit to 0
    bytes = [].concat(ip.toByteArray().slice(0, 3), [0]);
  } else {
    // Sets last 88bit to 0
    bytes = [].concat(ip.toByteArray().slice(0, 5), Array(11).fill(0));
  }

  return ipaddr.fromByteArray(bytes).toNormalizedString();
};

const middleware = (req, res, next) => {
  if(req.app.get('env') === 'production' && process.env.GOOGLE_ANALYTICS_TRACKING_ID) {
    res.on('finish', () => {
      // Only track page views, not API calls
      let contentType = res.getHeader('content-type');
      let isHtmlContent = contentType && contentType.includes('text/html');
      if(!isHtmlContent && res.statusCode !== 304) {
        return;
      }

      let hit = {
        v: 1, // Protocol version
        tid: process.env.GOOGLE_ANALYTICS_TRACKING_ID, // Tracking ID
        qt: Date.now(), // Queue time
        t: 'pageview', // Hit type
        ds: 'web', // Data source
        dh: req.headers.origin || process.env.HOST || FALLBACK_HOST, // Document Host
        dl: url.parse(req.originalUrl).pathname, // Document location,
        cid: crypto.createHash('sha256').update(req.sessionID).digest('base64'), // User ID
        ua: req.headers['user-agent'], // User agent override
        uip: anonymizeIp(req.ip), // IP override
      };

      // If page is error page, send exception hit instead of pageview hit
      if(res.locals.error) {
        hit.t = 'exception';
        hit.exd = res.locals.error.message;
      }

      // Custom dimensions
      if(res.locals.currentSchoolData) {
        hit.cd1 = res.locals.currentSchoolData.name;
      }
      if(res.locals.currentUser) {
        hit.cd2 = res.locals.currentUser.gender;
        hit.cd4 = res.locals.currentUser.roles[0].name;
        hit.cd5 = res.locals.currentRole === 'Demo' ? 1 : 0;
      }

      emit(hit);
    });
  }

  next();
};

// Flush hit queue on exit
process.on('exit', () => {
  console.log('Sending queued Google Analytics hits...');
  flush();
});

module.exports = {
  middleware: middleware,
};
