const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const fs = require('node:fs');
const express = require('express');

function themeName() {
	return Configuration.get('SC_THEME') || 'default';
}

const localesDir = path.join(__dirname, '../locales');
const buildThemeAssetDir = path.join(__dirname, `../build/${themeName()}`);
let assetManifest = null;
let revvedPaths = null;

/**
 * reads build/{theme}/asset-manifest.json (written by gulp-rev) once and caches it.
 * maps original relative path (e.g. "images/logo.svg") to its revved relative path.
 */
const getAssetManifest = () => {
	if (assetManifest == null) {
		try {
			const manifestPath = path.join(buildThemeAssetDir, 'asset-manifest.json');
			assetManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		} catch (err) {
			assetManifest = {};
		}
	}
	return assetManifest;
};

/**
 * the set of all revved (hashed) relative paths, used to tell them apart from originals for caching
 */
const getRevvedPaths = () => {
	if (revvedPaths == null) {
		revvedPaths = new Set(Object.values(getAssetManifest()));
	}
	return revvedPaths;
};

const staticAssetsMiddleware = (app) => {
	app.use('/locales', express.static(localesDir, {
		setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
	}));
	app.use(express.static(buildThemeAssetDir, {
		setHeaders: (res, filePath) => {
			if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') !== true) {
				res.setHeader('Cache-Control', 'no-cache');
				return;
			}
			const relativePath = path.relative(buildThemeAssetDir, filePath).split(path.sep).join('/');
			const maxAge = getRevvedPaths().has(relativePath)
				? Configuration.get('ASSET_CACHING_MAX_AGE_SECONDS')
				: 86400;
			res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
		},
	}));
};

/**
 * generates a file path to a static asset, using its revved (content-hashed) filename when available
 * @param {string} staticFilePath
 */
const getStaticAssetPath = (staticFilePath) => {
	if (Configuration.get('FEATURE_ASSET_CACHING_ENABLED') === true) {
		const revved = getAssetManifest()[staticFilePath.replace(/^\//, '')];
		if (revved) {
			return `/${revved}`;
		}
	}
	return staticFilePath;
};

/**
 * generates the path to a locale JS file (window.i18nLocaleData), content-hashed when asset caching is enabled
 * @param {string} lng
 */
const getLocaleScriptPath = (lng) => getStaticAssetPath(`/locales/${lng}.i18n.js`);

module.exports = {
	staticAssetsMiddleware,
	getStaticAssetPath,
	getLocaleScriptPath,
	themeName,
};
