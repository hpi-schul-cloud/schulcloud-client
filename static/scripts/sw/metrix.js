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

function sendResults(result, url) {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', '/logs/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	// eslint-disable-next-line no-undef
	xhr.setRequestHeader('Csrf-Token', csrftoken);
	const data = {
		attributes: {
			context: result,
			url,
		},
	};
	xhr.send(JSON.stringify(data));
}

function calculateMetrics(result, url) {
	//getFirstConsistentlyInteractive waits for all timers to finish,
	//including the one used before redirecting to an external resource
	ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
		result['time-to-interactive'] = Math.round(tti);
		return result;
	}).then((_result) => {
		addResultsAndSend(_result, url);
	});
}

function addResultsAndSend(result, url) {
	measureCRP(result);
	calculatePaintingTimes(result);
	readConnectionType(result);
	readNetworkProtocol(result);
	sendResults(result, url);
}

window.addEventListener('load', () => {
	setTimeout(() => {
		const result = {};
		if (window.location.pathname.startsWith('/redirect')) {
			result['time-to-interactive'] = -1;
			const url = (new URL(document.location)).searchParams.get('href');
			addResultsAndSend(result, url);
		} else {
			const url = window.location.href;
			calculateMetrics(result, url);
		}
	}, 0);
});