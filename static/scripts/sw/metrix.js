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
      var t = window.performance.timing,
        // markiert die Einsatzbereitschaft des DOM
        interactive = t.domInteractive - t.domLoading,
        // markiert typischerweise den Zeitpunkt, zu dem sowohl das DOM als auch das CSSOM einsatzbereit sind.
        dcl = t.domContentLoadedEventStart - t.domLoading,
        // markiert den Zeitpunkt, zu dem die Seite und alle ihre Unterressourcen einsatzbereit sind
        complete = t.domComplete - t.domLoading;
      result['time-dom-interactive'] = interactive;
      result['dom-content-loaded'] = dcl;
      result['dom-complete'] = complete;
      return result;
    }
  }

import ttiPolyfill from './tti-polyfill.js'; 

function calculateMetrics() {
    let result = {};
    ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
      result['time-to-interactive'] = Math.round(tti);
      return result;
    }).then(result => {
      measureCRP(result);
      calculatePaintingTimes(result);
      for (var prop in result) {
        if (result.hasOwnProperty(prop)) {
          console.log(prop + " = " + result[prop] + "ms");
        }
      }
    });
  }

calculateMetrics();
