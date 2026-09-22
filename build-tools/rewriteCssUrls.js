// build-time only: rewrites CSS url() references to point at their gulp-rev revved filenames
const fs = require('node:fs');
const path = require('node:path');

const IGNORED_DIRS = new Set(['sourcemaps']);

const walkCssFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
	const entryPath = path.join(dir, entry.name);
	if (entry.isDirectory()) {
		return IGNORED_DIRS.has(entry.name) ? [] : walkCssFiles(entryPath);
	}
	return entry.name.endsWith('.css') ? [entryPath] : [];
});

// resolves a url() reference (root-relative or relative to the referencing CSS file) to a manifest key
const resolveCssReference = (cssRelativePath, reference) => {
	if (reference.startsWith('/')) {
		return reference.slice(1);
	}
	return path.posix.normalize(path.posix.join(path.posix.dirname(cssRelativePath), reference));
};

const isRewritableReference = (reference) => !/^(data:|[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference);

const rewriteContent = (content, cssRelativePath, manifest) => content.replace(
	/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
	(match, quote, rawValue) => {
		if (!isRewritableReference(rawValue)) {
			return match;
		}
		const splitIndex = rawValue.search(/[?#]/);
		const cleanPath = splitIndex === -1 ? rawValue : rawValue.slice(0, splitIndex);
		const suffix = splitIndex === -1 ? '' : rawValue.slice(splitIndex);
		const revved = manifest[resolveCssReference(cssRelativePath, cleanPath)];
		if (!revved) {
			return match;
		}
		// gulp-rev only renames the basename, so swap it in without touching the rest of the reference
		const dir = cleanPath.slice(0, cleanPath.length - path.posix.basename(cleanPath).length);
		return `url(${quote}${dir}${path.posix.basename(revved)}${suffix}${quote})`;
	},
);

/**
 * rewrites url() references in every build/{theme}/styles/**\/*.css file to point at the
 * gulp-rev'd filenames recorded in the manifest (build/{theme}/asset-manifest.json)
 * @param {string} buildDir absolute path to the theme's build output, e.g. build/default
 * @param {Record<string, string>} manifest gulp-rev manifest: original relative path -> revved relative path
 */
const rewriteCssUrls = (buildDir, manifest) => {
	walkCssFiles(buildDir).forEach((filePath) => {
		const cssRelativePath = path.relative(buildDir, filePath).split(path.sep).join('/');
		const original = fs.readFileSync(filePath, 'utf8');
		const rewritten = rewriteContent(original, cssRelativePath, manifest);
		if (rewritten !== original) {
			fs.writeFileSync(filePath, rewritten);
		}
	});
};

module.exports = { rewriteCssUrls };
