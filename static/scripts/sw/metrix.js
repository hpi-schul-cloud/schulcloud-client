/**
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming
 */
function calculatePaintingTimes(result) {
  if ('performance' in window) {
    let performance = window.performance;
    let performanceEntries = performance.getEntriesByType('paint');
    performanceEntries.forEach((performanceEntry, i, entries) => {
      result[performanceEntry.name] = Math.round(performanceEntry.startTime);
    });
  }
}

/**
 * https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp
 */
function measureCRP(result) {
  if ('performance' in window) {
    let t = window.performance.timing;
    result['dom-interactive-time'] = t.domInteractive - t.navigationStart;
    result['dom-content-loaded'] = t.domContentLoadedEventEnd - t.navigationStart;
    result['page-loaded'] = t.loadEventEnd - t.navigationStart;
    result['request-start'] = t.requestStart - t.navigationStart;
    result['response-start'] = t.responseStart - t.navigationStart;
    result['response-end'] = t.responseEnd - t.navigationStart;
    return result;
  }
}

function readConnectionType(result) {
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    result['connection'] = connection.effectiveType;
    result['downlink'] = connection.downlink;
  }
}

import ttiPolyfill from './tti-polyfill.js';

function sendResults(result) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/logs/', true);
  xhr.setRequestHeader('Content-type', 'application/json');
  let data = {
    attributes: {
      context: result,
      url: window.location.href
    }
  };
  xhr.send(JSON.stringify(data));
}

function calculateMetrics() {
  let result = {};
  ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
    result['time-to-interactive'] = Math.round(tti);
    return result;
  }).then(result => {
    measureCRP(result);
    calculatePaintingTimes(result);
    readConnectionType(result);
    sendResults(result);
  });
}

window.addEventListener('load', function () {
  function updateOnlineStatus(event) {
    if (navigator.onLine) {
      $('#offlineAlert').hide();
    } else {
      $('#offlineAlert').show();
    }
  }
  let testUserGroup = parseInt(document.getElementById('testUserGroup').value);
  if (testUserGroup == 1) {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }
});

calculateMetrics();
