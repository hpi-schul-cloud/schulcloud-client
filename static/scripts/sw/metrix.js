/**
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming
 */
import ttiPolyfill from './tti-polyfill';

function calculatePaintingTimes(result) {
	if ('performance' in window) {
		const { performance } = window;
		const performanceEntries = performance.getEntriesByType('paint');
		performanceEntries.forEach((performanceEntry) => {
			result[performanceEntry.name] = Math.round(performanceEntry.startTime);
		});
	}
}

/**
* https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp
*/
function measureCRP(result) {
	if ('performance' in window) {
		const t = window.performance.timing;
		result['dom-interactive-time'] = t.domInteractive - t.navigationStart;
		result['dom-content-loaded'] = t.domContentLoadedEventEnd - t.navigationStart;
		result['page-loaded'] = t.loadEventEnd - t.navigationStart;
		result['request-start'] = t.requestStart - t.navigationStart;
		result['response-start'] = t.responseStart - t.navigationStart;
		result['response-end'] = t.responseEnd - t.navigationStart;
		return result;
	}
	return null;
}

function readConnectionType(result) {
	const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
	if (connection) {
		result.connection = connection.effectiveType;
		result.downlink = connection.downlink;
	}
}

function setProtocol(result, perfEntry) {
	const value = 'nextHopProtocol' in perfEntry;
	if (value) {
		result.networkProtocol = perfEntry.nextHopProtocol;
	} else {
		result.networkProtocol = 'unknown';
	}
}

function readNetworkProtocol(result) {
	if (performance && performance.getEntriesByType) {
		const p = performance.getEntriesByType('resource');
		for (let i = 0; i < p.length; i += 1) {
			setProtocol(result, p[i]);
			break;
		}
	}
}

function sendResults(result) {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', '/logs/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	// eslint-disable-next-line no-undef
	xhr.setRequestHeader('Csrf-Token', csrftoken);
	const data = {
		attributes: {
			context: result,
			url: window.location.href,
		},
	};
	xhr.send(JSON.stringify(data));
}

function calculateMetrics() {
	const result = {};
	ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
		result['time-to-interactive'] = Math.round(tti);
		return result;
	}).then((_result) => {
		measureCRP(_result);
		calculatePaintingTimes(_result);
		readConnectionType(_result);
		readNetworkProtocol(_result);
		sendResults(_result);
	});
}

/* disabled
window.addEventListener('load', () => {

	setTimeout(() => {
		calculateMetrics();
	}, 0); 
});
*/
