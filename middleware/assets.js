const staticify = require('staticify');
const fs = require('fs');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const express = require('express');
const {
	SC_THEME,
} = require('../config/global');

const localesDir = path.join(__dirname, '../locales');
const themeAssetDir = path.join(__dirname, `../build/${SC_THEME}`);
if (!fs.existsSync(themeAssetDir)) {
	throw new Error('could not find theme asset dir', { themeAssetDir });
}

// configure static file hashing and caching
const staticifyInstance = staticify(themeAssetDir, {
	maxAgeNonHashed: '1d',
	sendOptions: {
		maxAge: 3600 * 1000, // one hour, in milliseconds // TODO test
	},
});

/**
 * middleware for static assets may use hashed file names
 */
const staticAssetsMiddleware = (app) => {
	app.use(express.static(path.join(themeAssetDir)));
	app.use('/locales', express.static(localesDir)); // TODO test
	app.use((req, res, next) => {
		if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
			staticifyInstance.middleware(req, res, next);
		} else {
			next();
		}
	});
};

/**
 * generates a file path to a static asset with adding a hash into filename
 * @param {string} staticFilePath
 */
const getStaticAssetPath = (staticFilePath) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		return staticifyInstance.getVersionedPath(staticFilePath);
	}
	return staticFilePath;
};

module.exports = { staticAssetsMiddleware, getStaticAssetPath };
