/* eslint-disable no-console */

const autoprefixer = require('autoprefixer');
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const gulpErrorHandler = require('gulp-error-handle');
const header = require('gulp-header');
const gulpif = require('gulp-if');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const cssvariables = require('postcss-css-variables');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const rimraf = require('gulp-rimraf');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const path = require('path');
const named = require('vinyl-named');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const rev = require('gulp-rev').default;
const revRewrite = require('gulp-rev-rewrite').default;
const { themeName } = require('./middleware/assets');
const webpackConfig = require('./webpack.config');

const browserlist = ['> 0.2%', 'last 10 version', 'not dead'];
const ASSET_MANIFEST = 'asset-manifest.json';
const localesDir = path.resolve(__dirname, 'locales');
const buildDirFor = (theme) => path.resolve(__dirname, 'build', theme);
const manifestPathFor = (theme) => path.join(buildDirFor(theme), ASSET_MANIFEST);

const baseScripts = [
	'./node_modules/jquery/dist/jquery.min.js',
	'./node_modules/form-serializer/dist/jquery.serialize-object.min.js',
	'./static/scripts/tether/tether.min.js',
	'./static/scripts/bootstrap/bootstrap.min.js',
	'./static/scripts/chosen/chosen.jquery.min.js',
	'./static/scripts/base.js',
	'./static/scripts/toggle/bootstrap-toggle.min.js',
	'./static/scripts/qrcode/kjua-0.1.1.min.js',
	'./static/scripts/ajaxconfig.js',
];

// specify css files (e.g. in node modules) that should be copied to the build directory
const baseStyles = [
	{ dirname: 'calendar/', filename: 'fullcalendar.min.css', src: './node_modules/@fullcalendar/core/main.min.css' },
	{ dirname: 'calendar/', filename: 'daygrid.min.css', src: './node_modules/@fullcalendar/daygrid/main.min.css' },
	{ dirname: 'calendar/', filename: 'timegrid.min.css', src: './node_modules/@fullcalendar/timegrid/main.min.css' },
];

const EXIT_ON_ERROR = process.env.GULP_EXIT_ON_ERROR
	? process.env.GULP_EXIT_ON_ERROR === 'true'
	: process.env.NODE_ENV !== 'development';

const nonBaseScripts = [
	'./static/scripts/**/*.js',
].concat(baseScripts.map((script) => `!${script}`));

function withTheme(src) {
	if (typeof src === 'string') {
		return [src, `./theme/${themeName()}/${src.slice(2)}`];
	}
	return src.concat(src
		.map((e) => `./theme/${themeName()}/${e.slice(2)}`));
}

const handleError = (error) => {
	console.error(error);
	process.exit(1);
};

// used by almost all gulp tasks instead of gulp.src(...)
// plumber prevents pipes from stopping when errors occur
const beginPipe = (src) => gulp
	.src(withTheme(src), { allowEmpty: true })
	.pipe(gulpif(EXIT_ON_ERROR, gulpErrorHandler(handleError), plumber()));

// copy images
// uses gulp.src instead of beginPipe for performance reasons (logging is slow)
gulp.task('images', () => gulp
	.src(withTheme('./static/images/**/*.*'))
	.pipe(gulp.dest(`./build/${themeName()}/images`)));

// copy static/other
// uses gulp.src instead of beginPipe for performance reasons (logging is slow)
gulp.task('other', () => gulp
	.src('./static/other/**/*.*')
	.pipe(gulp.dest(`./build/${themeName()}/other`)));

gulp.task('styles', () => {
	const themeFile = `./theme/${themeName()}/style.scss`;
	return beginPipe('./static/styles/**/*.{css,sass,scss}')
		.pipe(header(fs.readFileSync(themeFile, 'utf8')))
		.pipe(sourcemaps.init())
		.pipe(sass({
			sourceMap: true,
			includePaths: ['node_modules'],
		}).on('error', handleError))
		.pipe(postcss([
			cssvariables({
				preserve: true,
			}),
			autoprefixer({
				overrideBrowserslist: browserlist,
			}),
		]))
		.pipe(cleanCSS())
		.pipe(sourcemaps.write('./sourcemaps'))
		.pipe(gulp.dest(`./build/${themeName()}/styles`));
});

const copyStyle = (dirname, filename, src) => gulp.src(src)
	.pipe(rename((targetPath) => {
		targetPath.basename = path.parse(filename).name;
		targetPath.dirname = dirname;
	}))
	.pipe(gulp.dest(`./build/${themeName()}/styles`));

gulp.task('copy-styles',
	() => merge(baseStyles.map(({ dirname, filename, src }) => copyStyle(dirname, filename, src))));

// copy fonts
gulp.task('fonts', () => beginPipe('./static/fonts/**/*.{eot,svg,ttf,woff,woff2}')
	.pipe(gulp.dest(`./build/${themeName()}/fonts`)));

// copy static assets
gulp.task('static', () => beginPipe('./static/*')
	.pipe(gulp.dest(`./build/${themeName()}/`)));

// compile/transpile JSX and ES6 to ES5 and minify scripts
gulp.task('scripts', () => beginPipe(nonBaseScripts)
	.pipe(
		named((file) => {
			// As a preparation for webpack stream: Transform nonBaseScripts paths
			// e.g. '/static/scripts/schics/schicEdit.blub.min.js' -> 'schics/schicEdit.blub.min'
			const initialPath = file.history[0].split('scripts')[1];
			const pathSegments = initialPath.split('.');
			const concretePath = pathSegments
				.slice(0, pathSegments.length - 1)
				.join('.');
			const fileName = concretePath
				.split('')
				.slice(1)
				.join('');

			return fileName;
		}),
	)
	.pipe(webpackStream(webpackConfig, webpack))
	.pipe(gulp.dest(`./build/${themeName()}/scripts`)));

// compile/transpile JSX and ES6 to ES5, minify and concatenate base scripts into all.js
gulp.task('base-scripts', () => beginPipe(baseScripts)
	.pipe(babel({
		presets: [
			[
				'@babel/preset-env',
				{
					modules: false,
					targets: browserlist.join(', '),
				},
			],
		],
	}))
	.pipe(uglify())
	.pipe(concat('all.js'))
	.pipe(gulp.dest(`./build/${themeName()}/scripts`)));

// compile/transpile vendor JSX and ES6 to ES5 and minify scripts
gulp.task('vendor-scripts', () => beginPipe('./static/vendor/**/*.js')
	.pipe(babel({
		compact: false,
		presets: [
			[
				'@babel/preset-env',
				{
					modules: false,
					targets: browserlist.join(', '),
				},
			],
		],
		plugins: ['@babel/plugin-transform-react-jsx'],
	}))
	.pipe(uglify())
	.pipe(gulp.dest(`./build/${themeName()}/vendor`)));

// copy other vendor files
gulp.task('vendor-assets', () => beginPipe([
	'./static/vendor/**/*.*',
	'!./static/vendor/**/*.js',
	'!./static/vendor/**/*.{sass,scss}',
]).pipe(gulp.dest(`./build/${themeName()}/vendor`)));

// copy node modules
const nodeModules = {
	// example
	// 'module/path/to/keep': [
	// 	 '**/*', // matched files, e.g. copy all files in folder
	//	 'folder/**/*', // folders defined by name will be flattened
	// ],

	// katex
	'katex/dist': ['katex.min.js', 'katex.min.css'],
	'katex/dist/fonts': ['**/*'],
	'katex/dist/contrib': ['auto-render.min.js'],

	// font-awesome
	'font-awesome/fonts': [
		'**/*',
	],

	// material design
	'@mdi/font': [
		'**/*',
	],

	// video.js
	'video.js/dist': ['video.min.js'],
	'video.js/dist/lang': ['*.js'],
};
gulp.task('node-modules', () => {
	const promises = [];

	for (const [module, modulePaths] of Object.entries(nodeModules)) {
		promises.push(
			gulp.src(modulePaths.map((modulePath) => `./node_modules/${module}/${modulePath}`))
				.pipe(gulp.dest(`./build/${themeName()}/vendor-optimized/${module}`)),
		);
	}

	return Promise.all(promises);
});

// clear build folder + smart cache
gulp.task('clear', () => gulp
	.src(
		[
			'./build/*',
			'./.gulp-changed-smart.json',
			'./node_modules/.cache/webpack',
		],
		{
			read: false,
			allowEmpty: true,
		},
	)
	.pipe(rimraf()));

// hashes every non-CSS build asset with gulp-rev, keeping the original files alongside the revved copies
gulp.task('rev-assets', () => gulp.src(
	[
		`./build/${themeName()}/**/*`,
		`!./build/${themeName()}/styles/**`,
		`!./build/${themeName()}/${ASSET_MANIFEST}`,
	],
	{ base: `./build/${themeName()}`, allowEmpty: true },
)
	.pipe(rev())
	.pipe(gulp.dest(`./build/${themeName()}`))
	.pipe(rev.manifest(manifestPathFor(themeName()), { base: `./build/${themeName()}`, merge: true }))
	.pipe(gulp.dest(`./build/${themeName()}`)));

// rewrites CSS url() references (images/fonts) to their revved filenames from the manifest
gulp.task('rewrite-css-urls', () => {
	const manifestPath = manifestPathFor(themeName());
	const manifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath) : Buffer.from('{}');
	return gulp.src(`./build/${themeName()}/styles/**/*.css`, { base: `./build/${themeName()}` })
		.pipe(revRewrite({ manifest }))
		.pipe(gulp.dest(`./build/${themeName()}`));
});

// hashes the (now rewritten) CSS files and merges them into the same manifest
gulp.task('rev-styles', () => gulp.src(`./build/${themeName()}/styles/**/*.css`, { base: `./build/${themeName()}` })
	.pipe(rev())
	.pipe(gulp.dest(`./build/${themeName()}`))
	.pipe(rev.manifest(manifestPathFor(themeName()), { base: `./build/${themeName()}`, merge: true }))
	.pipe(gulp.dest(`./build/${themeName()}`)));

// full revisioning pass: rev everything else, rewrite CSS references, then rev the CSS itself
gulp.task('asset-manifest', gulp.series('rev-assets', 'rewrite-css-urls', 'rev-styles'));

// wraps locales/*.json as window.i18nLocaleData scripts so they're revved like any other asset
gulp.task('locale-scripts', (done) => {
	const outDir = path.join(buildDirFor(themeName()), 'locales');
	fs.mkdirSync(outDir, { recursive: true });
	fs.readdirSync(localesDir)
		.filter((file) => file.endsWith('.json'))
		.forEach((file) => {
			const lng = path.basename(file, '.json');
			const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
			fs.writeFileSync(path.join(outDir, `${lng}.i18n.js`), `window.i18nLocaleData = ${content};`);
		});
	done();
});

// run this if only 'gulp' is run on the commandline with no task specified
gulp.task('default', gulp.series(
	'images',
	'other',
	'fonts',
	'node-modules',
	'styles',
	'copy-styles',
	'scripts',
	'base-scripts',
	'vendor-scripts',
	'vendor-assets',
	'static',
	'locale-scripts',
	'asset-manifest',
));

// incremental dev watch — do a full build first, then watch for changes
// styles/scripts/images re-run only when their source files change
gulp.task('watch', gulp.series('default', (done) => {
	console.log('Watching for changes…');

	gulp.watch(
		withTheme('./static/styles/**/*.{css,sass,scss}'),
		gulp.series('styles', 'copy-styles', 'asset-manifest'),
	);

	gulp.watch(
		withTheme('./static/scripts/**/*.js'),
		gulp.series('scripts', 'asset-manifest'),
	);

	gulp.watch(
		withTheme('./static/images/**/*.*'),
		gulp.series('images', 'asset-manifest'),
	);

	gulp.watch('./static/*', gulp.series('static', 'asset-manifest'));

	gulp.watch('./locales/*.json', gulp.series('locale-scripts', 'asset-manifest'));

	// signal async completion — watcher runs indefinitely
	done();
}));
