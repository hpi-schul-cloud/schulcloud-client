/* eslint-disable no-console */

const autoprefixer = require('autoprefixer');
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const gulpCount = require('gulp-count');
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
const change = require('gulp-change');
const { rewriteStaticAssetPaths } = require('./middleware/assets');
const webpackConfig = require('./webpack.config');

const browserlist = ['> 0.2%', 'last 10 version', 'not dead'];

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

function themeName() {
	return process.env.SC_THEME || 'default';
}

const EXIT_ON_ERROR = process.env.GULP_EXIT_ON_ERROR
	? process.env.GULP_EXIT_ON_ERROR === 'true'
	: process.env.NODE_ENV !== 'development';

const nonBaseScripts = [
	'./static/scripts/**/*.js',
].concat(baseScripts.map((script) => `!${script}`));
// used by almost all gulp tasks instead of gulp.src(...)
// plumber prevents pipes from stopping when errors occur
// changed only passes on files that were modified since last time

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

const beginPipe = (src) => gulp
	.src(withTheme(src), { allowEmpty: true, since: gulp.lastRun('build-all') })
	.pipe(gulpif(EXIT_ON_ERROR, gulpErrorHandler(handleError), plumber()));

const beginPipeAll = (src) => gulp
	.src(withTheme(src), { allowEmpty: true, since: gulp.lastRun('build-all') })
	.pipe(gulpif(EXIT_ON_ERROR, gulpErrorHandler(handleError), plumber()));

// copy images
// uses gulp.src instead of beginPipe for performance reasons (logging is slow)
gulp.task('images', () => gulp
	.src(withTheme('./static/images/**/*.*'))
	.pipe(gulp.dest(`./build/${themeName()}/images`)));

// minify static/other
// uses gulp.src instead of beginPipe for performance reasons (logging is slow)
gulp.task('other', () => gulp
	.src(withTheme('./static/other/**/*.*'))
	.pipe(gulp.dest(`./build/${themeName()}/other`)));

// minify static/other
// uses gulp.src instead of beginPipe for performance reasons (logging is slow)
gulp.task('other-with-theme', gulp.series('other', () => gulp
	.src(withTheme('./static/other/**/*.*'))
	.pipe(gulp.dest(`./build/${themeName()}/other`))));

let firstRun = true;
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
				browsers: browserlist,
			}),
		]))
		.pipe(cleanCSS({
			compatibility: 'ie9',
		}))
		.pipe(change(rewriteStaticAssetPaths))
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

gulp.task('styles-done', gulp.series('styles'), () => {
	firstRun = false;
});

// copy fonts
gulp.task('fonts', () => beginPipe('./static/fonts/**/*.{eot,svg,ttf,woff,woff2}')
	.pipe(gulp.dest(`./build/${themeName()}/fonts`)));

// copy static assets
gulp.task('static', () => beginPipe('./static/*')
	.pipe(gulp.dest(`./build/${themeName()}/`)));

// compile/transpile JSX and ES6 to ES5 and minify scripts
gulp.task('scripts', () => beginPipeAll(nonBaseScripts)
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
gulp.task('base-scripts', () => beginPipeAll(baseScripts)
	.pipe(gulpCount('## js-files selected'))
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

// compile vendor SASS/SCSS to CSS and minify it
gulp.task('vendor-styles', () => beginPipe('./static/vendor/**/*.{sass,scss}')
	.pipe(sourcemaps.init())
	.pipe(sass({
		sourceMap: true,
	}))
	.pipe(postcss([
		autoprefixer({
			browsers: browserlist,
		}),
	]))
	.pipe(cleanCSS({
		compatibility: 'ie9',
	}))
	.pipe(sourcemaps.write('./sourcemaps'))
	.pipe(gulp.dest(`./build/${themeName()}/vendor`)));

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

	// mathjax
	mathjax: ['MathJax.js'],
	'mathjax/config': ['**/*'],
	'mathjax/extensions': ['**/*'],
	'mathjax/fonts': ['**/*'],
	'mathjax/jax': ['**/*'],
	'mathjax/localization': ['**/*'],

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
			'./.webpack-changed-plugin-cache/*',
		],
		{
			read: false,
			allowEmpty: true,
		},
	)
	.pipe(rimraf()));

// clear gulp cache without removing current build
gulp.task('clear-cache', () => gulp
	.src(
		[
			'./.gulp-changed-smart.json',
			'./.webpack-changed-plugin-cache/*',
		],
		{
			read: false,
			allowEmpty: true,
		},
	)
	.pipe(rimraf({})));

// run all tasks, processing changed files
gulp.task('build-all', gulp.series(
	'images',
	'other',
	'fonts',
	'other-with-theme',
	'node-modules',
	'styles',
	'styles-done',
	'copy-styles',
	'scripts',
	'base-scripts',
	'vendor-styles',
	'vendor-scripts',
	'vendor-assets',
	'static',
));

gulp.task('build-theme-files', gulp.series('styles', 'styles-done', 'images', 'static'));

// run this if only 'gulp' is run on the commandline with no task specified
gulp.task('default', gulp.series('build-all'));
