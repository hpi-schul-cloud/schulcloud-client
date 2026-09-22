// build-time only: wraps locale JSON files as window.i18nLocaleData scripts so they
// flow through the same asset-manifest hashing as any other build asset
const fs = require('node:fs');
const path = require('node:path');

const localesDir = path.join(__dirname, '../locales');

/**
 * writes build/{theme}/locales/{lng}.i18n.js for every locales/*.json file
 * @param {string} buildDir absolute path to the theme's build output, e.g. build/default
 */
const buildLocaleScripts = (buildDir) => {
	const outDir = path.join(buildDir, 'locales');
	fs.mkdirSync(outDir, { recursive: true });
	fs.readdirSync(localesDir)
		.filter((file) => file.endsWith('.json'))
		.forEach((file) => {
			const lng = path.basename(file, '.json');
			const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
			fs.writeFileSync(path.join(outDir, `${lng}.i18n.js`), `window.i18nLocaleData = ${content};`);
		});
};

module.exports = { buildLocaleScripts };
