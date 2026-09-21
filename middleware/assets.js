const staticify = require('staticify');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
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
 * generates the path to a locale file, content-hashed when asset caching is enabled
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

module.exports = {
	staticAssetsMiddleware, getStaticAssetPath, rewriteStaticAssetPaths, getLocalePath, themeName,
};
