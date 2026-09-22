const staticify = require('staticify');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const fs = require('node:fs');
const express = require('express');

function themeName() {
	return Configuration.get('SC_THEME') || 'default';
}

let staticifyInstance = null;
let localesStaticifyInstance = null;
const localesDir = path.join(__dirname, '../locales');
const buildThemeAssetDir = path.join(__dirname, `../build/${themeName()}`);

/**
 * initializes the staticify instance lazy which is required in gulp
 */
const lazyInitialization = () => {
	if (staticifyInstance == null) {
		// configure static file hashing and caching
		staticifyInstance = staticify(buildThemeAssetDir, {
			maxAgeNonHashed: '1d',
			sendOptions: {
				// seconds multiplied by 1000 as it takes millis
				maxAge: Configuration.get('ASSET_CACHING_MAX_AGE_SECONDS') * 1000,
				etag: false,
			},
		});
	}
};

/**
 * initializes the locales staticify instance lazily
 */
const localesLazyInitialization = () => {
	if (localesStaticifyInstance == null) {
		localesStaticifyInstance = staticify(localesDir, {
			sendOptions: {
				maxAge: Configuration.get('ASSET_CACHING_MAX_AGE_SECONDS') * 1000,
				etag: false,
			},
		});
	}
};

/**
 * middleware for static assets may use hashed file names
 */
const serveLocaleScript = (req, res, next) => {
	const match = req.path.match(/^\/locales\/([a-z]+)(?:\.[a-z0-9]+)?\.i18n\.js$/i);
	if (!match) {
		return next();
	}
	const lng = match[1];
	const filePath = path.join(localesDir, `${lng}.json`);
	return fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			return res.type('application/javascript').send('window.i18nLocaleData = {};');
		}
		const cacheControl = Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true
			? `max-age=${Configuration.get('ASSET_CACHING_MAX_AGE_SECONDS')}`
			: 'no-cache';
		res.setHeader('Cache-Control', cacheControl);
		return res.type('application/javascript').send(`window.i18nLocaleData = ${data};`);
	});
};

const staticAssetsMiddleware = (app) => {
	app.use('/locales', express.static(localesDir, {
		setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
	}));
	app.use('/locales', (req, res, next) => {
		if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
			localesLazyInitialization();
			return localesStaticifyInstance.middleware(req, res, next);
		}
		return next();
	});
	app.use(serveLocaleScript);
	app.use(express.static(path.join(buildThemeAssetDir)));
	app.use((req, res, next) => {
		if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
			lazyInitialization();
			return staticifyInstance.middleware(req, res, next);
		}
		return next();
	});
};

/**
 * generates a file path to a static asset with adding a hash into filename
 * @param {string} staticFilePath
 */
const getStaticAssetPath = (staticFilePath) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		lazyInitialization();
		return staticifyInstance.getVersionedPath(staticFilePath);
	}
	return staticFilePath;
};

const rewriteStaticAssetPaths = (content) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		lazyInitialization();
		const contentWithRewrittenUrls = staticifyInstance.replacePaths(content);
		return contentWithRewrittenUrls;
	}
	return content;
};

/**
 * generates the path to a locale JSON file, content-hashed when asset caching is enabled
 * @param {string} lng
 */
const getLocalePath = (lng) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		localesLazyInitialization();
		const versionedPath = localesStaticifyInstance.getVersionedPath(`/${lng}.json`);
		return `/locales${versionedPath}`;
	}
	return `/locales/${lng}.json`;
};

/**
 * generates the path to a locale JS file (window.i18nLocaleData), content-hashed when asset caching is enabled
 * @param {string} lng
 */
const getLocaleScriptPath = (lng) => getLocalePath(lng).replace('.json', '.i18n.js');

module.exports = {
	staticAssetsMiddleware,
	getStaticAssetPath,
	rewriteStaticAssetPaths,
	getLocaleScriptPath,
	themeName,
};
