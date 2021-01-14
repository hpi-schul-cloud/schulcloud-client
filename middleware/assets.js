const staticify = require('staticify');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const express = require('express');
const {
	SC_THEME,
} = require('../config/global');

let staticifyInstance = null;
const localesDir = path.join(__dirname, '../locales');
const buildThemeAssetDir = path.join(__dirname, `../build/${SC_THEME}`);

/**
 * initializes the staticify instance lazy which is required in gulp
 */
const lazyInitialization = () => {
	if (staticifyInstance == null) {
		// expectAssetsDir();
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
 * middleware for static assets may use hashed file names
 */
const staticAssetsMiddleware = (app) => {
	app.use('/locales', express.static(localesDir));
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

module.exports = { staticAssetsMiddleware, getStaticAssetPath, rewriteStaticAssetPaths };
