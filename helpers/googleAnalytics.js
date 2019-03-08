/* eslint-disable no-console */
const fs = require('fs');
const url = require('url');
const path = require('path');
const crypto = require('crypto');
const maxmind = require('maxmind');
const csv = require('fast-csv');
const Request = require('request-promise');
const ipaddr = require('ipaddr.js');
const queryString = require('query-string');

const SOCKET_POOL_SIZE = 32;
const MAX_BATCH_SIZE = 10;
const MAX_QUEUE_TIME = 60 * 60 * 1000;
const FALLBACK_HOST = 'https://schul-cloud.org';
const BATCH_HITS_ENDPOINT = 'https://www.google-analytics.com/batch';

let queue = [], googleCityIds = {}, geoIpLookup, flushTimer;
const request = Request.defaults({
  forever: true,
  pool: {maxSockets: SOCKET_POOL_SIZE}
});

const initialize = () => {
  return Promise.all([
    createGeoIpLookup().then(result => geoIpLookup = result),
    loadGoogleCityIds().then(result => googleCityIds = result),
  ]);
};

const createGeoIpLookup = () => {
  return new Promise((resolve, reject) => {
    // Uses GeoLite2 data created by MaxMind (http://www.maxmind.com) for geoip lookups
    maxmind.open(path.join(__dirname, '../data/geolite/GeoLite2-City.mmdb'), (err, lookup) => {
      if(err) {
        reject(err);
      } else {
        resolve(lookup);
      }
    });
  });
};

const loadGoogleCityIds = () => {
  return new Promise((resolve, reject) => {
    let cityIds = {};
    fs.createReadStream(path.join(__dirname, '../data/google-analytics/Location-Criteria-2017-11-02.csv'))
      .pipe(csv({headers : true}))
      .on('data', (row) => {
        if(row['Target Type'] !== 'City') {
          return;
        }

        let id = row['Criteria ID'];
        let countryCode = row['Country Code'];
        let cityName = row['Name'];
        if(typeof(cityIds[countryCode]) === 'undefined') {
          cityIds[countryCode] = {};
        }
        cityIds[countryCode][cityName] = id;
      })
      .on('end', () => {
        resolve(cityIds);
      });
  });
};

const emit = (hit) => {
  queue.push(hit);
  if(queue.length === MAX_BATCH_SIZE) {
    flush();
  } else if(!flushTimer) {
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

const getGeoId = (ip) => {
  let result = geoIpLookup.get(ip);
  if(!result || !result.country) {
    return;
  }

  let countryCode = result.country.iso_code;
  if(result.city) {
    let cityName = result.city.names.en;
    if(googleCityIds[countryCode] && googleCityIds[countryCode][cityName]) {
      return googleCityIds[countryCode][cityName];
    }
  }
  return countryCode;
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
        dr: req.headers['referer'], // Document Referrer
        cid: crypto.createHash('sha256').update(req.sessionID).digest('base64'), // User ID
        ua: req.headers['user-agent'], // User agent override
        uip: anonymizeIp(req.ip), // IP override
        geoid: getGeoId(req.ip), // Geographical override
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
				if (res.locals.currentUser.roles && res.locals.currentUser.roles.length > 0) {
					hit.cd4 = res.locals.currentUser.roles[0].name;
				}
        hit.cd4 = res.locals.currentUser.roles[0].name;
        hit.cd5 = res.locals.currentRole === 'Demo' ? 1 : 0;
      }

      emit(hit);
    });
  }

  next();
};

module.exports = {
  middleware: () => {
    let initError = false;
    const initializeMiddleware = initialize().catch(err => {
      initError = true;
      console.error(err);
    });

    return (req, res, next) => {
      // Do not execute middleware, if an error occured while initialization
      if(initError) {
        return next();
      }

      // Ensure the middleware is initialized by waiting for the promise to resolve
      initializeMiddleware.then(() => middleware(req, res, next));
    };
  },
  anonymizeIp: (ip) => anonymizeIp(ip),
  getGeoId: (ip) => getGeoId(ip)
};

// Flush hit queue on exit
process.on('exit', () => {
  console.log('Sending queued Google Analytics hits...');
  flush();
});
