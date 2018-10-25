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




function updateLinkState(state) {
  function setOnline(link) {
    if ($(link).attr('data-href')) {
      $(link).removeAttr("disabled").removeAttr('aria-disabled');
      $(link).attr('href', $(link).attr('data-href'));
    }
  }
  function setOffline(link) {
    if ($(link).attr('href')) {
      $(link).attr("disabled", "disabled");
      $(link).attr('aria-disabled', 'true');
      $(link).attr('data-href', $(link).attr('href'));
      $(link).attr('href', '');
    }
  }
  if (state == 'ONLINE') {
    $('a').each(function () {
      setOnline(this);
    });
  } else {
    $('a').each(function () {
      var link = this;
      var url = $(link).attr('href');
      window.caches.match(url).then(function (response) {
        if (response) {
          setOnline(link);
        } else {
          setOffline(link);
        }
      });
    });
  }
}

function updateOnlineStatus(event) {
  if (navigator.onLine) {
    $('#offlineAlert').hide();
    updateLinkState('ONLINE');
  } else {
    $('#offlineAlert').show();
    updateLinkState('OFFLINE');
  }
}

window.addEventListener('load', function () {
  // disable click event on disabled links
  document.body.addEventListener('click', function (event) {
    if (event.target.nodeName == 'A' && event.target.getAttribute('aria-disabled') == 'true') {
      event.preventDefault();
    }
  });

  let testUserGroup = parseInt(document.getElementById('testUserGroup').value);
  if (testUserGroup == 1) {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }
});

calculateMetrics();
