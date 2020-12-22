const staticify = require('staticify');
const fs = require('fs');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const express = require('express');
const {
	SC_THEME,
} = require('../config/global');

const themeAssetDir = path.join(__dirname, `../build/${SC_THEME}`);
if (!fs.existsSync(themeAssetDir)) {
	throw new Error('could not find theme asset dir', { themeAssetDir });
}

// configure static file hashing and caching
const staticifyInstance = staticify(themeAssetDir, {
	maxAgeNonHashed: '1d',
	sendOptions: {
		maxAge: 3600 * 1000, // one hour, in milliseconds
	},
});

/**
 * middleware for static assets may use hashed file names
 */
const staticAssetsMiddleware = (req, res, next) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		return staticifyInstance.middleware(req, res, next);
	}
	return express.static(path.join(themeAssetDir))(req, res, next);
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
