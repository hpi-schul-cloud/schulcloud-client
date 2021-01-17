const promBundle = require('express-prom-bundle');
const { Configuration } = require('@hpi-schul-cloud/commons');

// should contain all ressources (files/folders) within static folder
const STATIC_RESSOURCES = [
	'/fonts',
	'/images',
	'/other',
	'/scripts',
	'/styles',
	'/vendor',
	'/indexeddb-worker.js',
	'/riot_config.json',
	'/robots.txt',
];

const rewriteStaticRessourcesPath = (path) => {
	if (STATIC_RESSOURCES.some((ressource) => path.startsWith(ressource))
	) {
		return '/any_static_ressource';
	}
	return path;
};

module.exports = (app) => {
	if (Configuration.has('FEATURE_PROMETHEUS_ENABLED') && Configuration.get('FEATURE_PROMETHEUS_ENABLED') === true) {
		const metricsOptions = {
			includeStatusCode: Configuration.get('PROMETHEUS__INCLUDE_STATUS_CODE'),
			includeMethod: Configuration.get('PROMETHEUS__INCLUDE_METHOD'),
			includePath: Configuration.get('PROMETHEUS__INCLUDE_PATH'),
			metricType: Configuration.get('PROMETHEUS__METRIC_TYPE'),
		};
		if (Configuration.get('PROMETHEUS__COLLECT_DEFAULT_METRICS') === true) {
			metricsOptions.promClient = {
				collectDefaultMetrics: {},
			};
		}
		const originalNormalize = promBundle.normalizePath;
		promBundle.normalizePath = (req, opts) => {
			let path = originalNormalize(req, opts);
			path = rewriteStaticRessourcesPath(path);
			return path ? path.replace('#val', '__id__') : path;
		};
		app.use(promBundle(metricsOptions));
	}
};
