const staticify = require('staticify');
const fs = require('fs');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const express = require('express');
const {
	SC_THEME,
} = require('../config/global');

const localesDir = path.join(__dirname, '../locales');
const buildThemeAssetDir = path.join(__dirname, `../build/${SC_THEME}`);
const buildThemeAssetDirExists = fs.existsSync(buildThemeAssetDir) === true;

const expectAssetsDir = () => {
	if (!buildThemeAssetDirExists) {
		throw new Error(`assets dir required, but not found: ${buildThemeAssetDir}. `
		+ 'Have you executed \'npm run build\' already?');
	}
};

expectAssetsDir();

// configure static file hashing and caching
const staticifyInstance = staticify(buildThemeAssetDir, {
	maxAgeNonHashed: '1d',
	sendOptions: {
		maxAge: 3600 * 1000, // one hour, in milliseconds
	},
});

/**
 * middleware for static assets may use hashed file names
 */
const staticAssetsMiddleware = (app) => {
	app.use('/locales', express.static(localesDir));
	app.use(express.static(path.join(buildThemeAssetDir)));
	app.use((req, res, next) => {
		if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
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
		return staticifyInstance.getVersionedPath(staticFilePath);
	}
	return staticFilePath;
};

module.exports = { staticAssetsMiddleware, getStaticAssetPath };
