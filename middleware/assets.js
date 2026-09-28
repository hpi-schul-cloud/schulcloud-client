const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const fs = require('node:fs');
const express = require('express');
const logger = require('../helpers/logger');

const ASSET_MANIFEST_FILE = 'asset-manifest.json';
let assetManifest = null;
let hashedPaths = null;

function themeName() {
	return Configuration.get('SC_THEME') || 'default';
}

const buildThemeAssetDir = path.join(__dirname, `../build/${themeName()}`);

/**
 * reads build/{theme}/asset-manifest.json (written by gulp-rev) once and caches it.
 * maps original relative path (e.g. "images/logo.svg") to its hashed relative path.
 */
const getAssetManifest = () => {
	if (assetManifest == null) {
		try {
			const manifestPath = path.join(buildThemeAssetDir, ASSET_MANIFEST_FILE);
			assetManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		} catch (err) {
			if (err.code !== 'ENOENT') {
				logger.error('failed to read asset manifest', err);
			}
			assetManifest = {};
		}
	}
	return assetManifest;
};

/**
 * the set of all hashed relative paths, used to tell them apart from originals for caching
 */
const getHashedPaths = () => {
	if (hashedPaths == null) {
		hashedPaths = new Set(Object.values(getAssetManifest()));
	}
	return hashedPaths;
};

const staticAssetsMiddleware = (app) => {
	app.use(
		express.static(buildThemeAssetDir, {
			setHeaders: (res, filePath) => {
				const isCachingEnabled = Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true;
				const maxAge = Configuration.get('ASSET_CACHING_MAX_AGE_SECONDS');

				if (!isCachingEnabled || !maxAge) {
					res.setHeader('Cache-Control', 'no-cache');
					return;
				}

				const relativePath = path.relative(buildThemeAssetDir, filePath).split(path.sep).join('/');
				if (!getHashedPaths().has(relativePath)) {
					res.setHeader('Cache-Control', 'no-cache');
					return;
				}

				res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
			},
		}),
	);
};

/**
 * generates a file path to a static asset, using its content-hashed filename when available
 * @param {string} staticFilePath
 */
const getStaticAssetPath = (staticFilePath) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		const hashedFilePath = getAssetManifest()[staticFilePath.replace(/^\//, '')];
		if (hashedFilePath) {
			return `/${hashedFilePath}`;
		}
	}
	return staticFilePath;
};

/**
 * generates the path to a locale JS file (window.i18nLocaleData), content-hashed when asset caching is enabled
 * @param {string} lng
 */
const getLocaleScriptPath = (language) => getStaticAssetPath(`/locales/${language}.i18n.js`);

module.exports = {
	staticAssetsMiddleware,
	getStaticAssetPath,
	getLocaleScriptPath,
	themeName,
};
