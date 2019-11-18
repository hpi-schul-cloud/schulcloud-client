/* eslint-disable no-console */

const autoprefixer = require('autoprefixer');
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const changed = require('gulp-changed-smart');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const gulpCount = require('gulp-count');
const filelog = require('gulp-filelog');
const header = require('gulp-header');
const gulpif = require('gulp-if');
const optimizejs = require('gulp-optimize-js');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const cssvariables = require('postcss-css-variables');
const rimraf = require('gulp-rimraf');
const sass = require('gulp-sass');
const sassGrapher = require('gulp-sass-grapher');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const path = require('path');
const named = require('vinyl-named');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync');
const webpackConfig = require('./webpack.config');

const baseScripts = [
	'./static/scripts/jquery/jquery.min.js',
	'./static/scripts/jquery/jquery.serialize-object.js',
	'./static/scripts/tether/tether.min.js',
	'./static/scripts/bootstrap/bootstrap.min.js',
	'./static/scripts/chosen/chosen.jquery.min.js',
	'./static/scripts/base.js',
	'./static/scripts/toggle/bootstrap-toggle.min.js',
	'./static/scripts/mailchimp/mailchimp.js',
	'./static/scripts/qrcode/kjua-0.1.1.min.js',
	'./static/scripts/ajaxconfig.js',
];

function themeName() {
	return process.env.SC_THEME || 'default';
}

const nonBaseScripts = [
	'./static/scripts/**/*.js',
].concat(baseScripts.map(script => `!${script}`));
// used by all gulp tasks instead of gulp.src(...)
// plumber prevents pipes from stopping when errors occur
// changed only passes on files that were modified since last time
// filelog logs and counts all processed files

function withTheme(src) {
	if (typeof src === 'string') {
		return [src, `./theme/${themeName()}/${src.slice(2)}`];
	}
	return src.concat(src
		.map(e => `./theme/${themeName()}/${e.slice(2)}`));
}

const beginPipe = src => gulp
	.src(withTheme(src))
	.pipe(plumber())
	.pipe(changed(gulp))
	.pipe(filelog());

const beginPipeAll = src => gulp
	.src(withTheme(src))
	.pipe(plumber())
	.pipe(filelog());

const handleError = (error) => {
	console.error(error);
	process.exit(1);
};

// handle errors with exit 1
gulp.on('err', (err) => {
	handleError(err);
});

// minify images
gulp.task('images', () => beginPipe('./static/images/**/*.*')
	.pipe(imagemin())
	.pipe(gulp.dest(`./build/${themeName()}/images`)));

// minify static/other
gulp.task('other', () => gulp
	.src('./static/other/**/*.*')
	.pipe(gulp.dest(`./build/${themeName()}/other`)));

const loadPaths = path.resolve('./static/styles/');
sassGrapher.init('./static/styles/', {
	loadPaths,
});
let firstRun = true;
gulp.task('styles', () => {
	const themeFile = `./theme/${themeName()}/style.scss`;
	return beginPipe('./static/styles/**/*.{css,sass,scss}')
		.pipe(gulpif(!firstRun, sassGrapher.ancestors()))
		.pipe(header(fs.readFileSync(themeFile, 'utf8')))
		.pipe(filelog('PROCESS: '))
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
				browsers: ['> 1%', 'not dead'],
			}),
		]))
		.pipe(cleanCSS({
			compatibility: 'ie9',
		}))
		.pipe(sourcemaps.write('./sourcemaps'))
		.pipe(gulp.dest(`./build/${themeName()}/styles`))
		.pipe(browserSync.stream());
});

gulp.task('styles-done', ['styles'], () => {
	firstRun = false;
});

// copy fonts
gulp.task('fonts', () => beginPipe('./static/fonts/**/*.*').pipe(gulp.dest(`./build/${themeName()}/fonts`)));

// copy static assets
gulp.task('static', () => beginPipe('./static/*').pipe(gulp.dest(`./build/${themeName()}/`)));

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
	.pipe(gulp.dest(`./build/${themeName()}/scripts`))
	.pipe(browserSync.stream()));

// compile/transpile JSX and ES6 to ES5, minify and concatenate base scripts into all.js
gulp.task('base-scripts', () => beginPipeAll(baseScripts)
	.pipe(gulpCount('## js-files selected'))
	.pipe(babel({
		presets: [
			[
				'@babel/preset-env',
				{
					modules: false,
					targets: '> 1%, not dead',
				},
			],
		],
	}))
	.pipe(optimizejs())
	.pipe(uglify())
	.pipe(concat('all.js'))
	.pipe(gulp.dest(`./build/${themeName()}/scripts`)));

// compile vendor SASS/SCSS to CSS and minify it
gulp.task('vendor-styles', () => beginPipe('./static/vendor/**/*.{css,sass,scss}')
	.pipe(sourcemaps.init())
	.pipe(sass({
		sourceMap: true,
	}))
	.pipe(postcss([
		autoprefixer({
			browsers: ['> 1%', 'not dead'],
		}),
	]))
	.pipe(cleanCSS({
		compatibility: 'ie9',
	}))
	.pipe(sourcemaps.write('./sourcemaps'))
	.pipe(gulp.dest(`./build/${themeName()}/vendor`))
	.pipe(browserSync.stream()));

// compile/transpile vendor JSX and ES6 to ES5 and minify scripts
gulp.task('vendor-scripts', () => beginPipe('./static/vendor/**/*.js')
	.pipe(babel({
		compact: false,
		presets: [
			[
				'@babel/preset-env',
				{
					modules: false,
					targets: '> 1%, not dead',
				},
			],
		],
		plugins: ['@babel/plugin-transform-react-jsx'],
	}))
	.pipe(optimizejs())
	.pipe(uglify())
	.pipe(gulp.dest(`./build/${themeName()}/vendor`)));

// copy other vendor files
gulp.task('vendor-assets', () => beginPipe([
	'./static/vendor/**/*.*',
	'!./static/vendor/**/*.js',
	'!./static/vendor/**/*.{css,sass,scss}',
]).pipe(gulp.dest(`./build/${themeName()}/vendor`)));

// copy vendor-optimized files
gulp.task('vendor-optimized-assets', () => beginPipe(['./static/vendor-optimized/**/*.*'])
	.pipe(gulp.dest(`./build/${themeName()}/vendor-optimized`)));

// copy node modules
const nodeModules = ['mathjax', 'font-awesome'];
gulp.task('node-modules', () => Promise.all(nodeModules
	.map(module => beginPipe([`./node_modules/${module}/**/*.*`])
		.pipe(gulp.dest(`./build/${themeName()}/vendor-optimized/${module}`)))));

// service worker patterns used for precaching of files
const globPatterns = [
	'fonts/**/*.{woff,css}',
	'images/logo/*.svg',
	'images/footer-logo.png',
	'scripts/all.js',
	'scripts/loggedin.js',
	'scripts/calendar.js',
	'scripts/dashboard.js',
	'scripts/courses.js',
	'scripts/news.js',
	'styles/lib/*.css',
	'styles/lib/toggle/*.min.css',
	'styles/lib/datetimepicker/*.min.css',
	'styles/calendar/*.css',
	'styles/news/*.css',
	'styles/courses/*.css',
	'styles/dashboard/*.css',
	'vendor/introjs/intro*.{js,css}',
	'vendor/feathersjs/feathers.js',
	'vendor-optimized/mathjax/MathJax.js',
	'images/manifest.json',
];


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
		},
	)
	.pipe(rimraf()));

// run all tasks, processing changed files
gulp.task('build-all', [
	'images',
	'other',
	'styles',
	'styles-done',
	'fonts',
	'scripts',
	'base-scripts',
	'vendor-styles',
	'vendor-scripts',
	'vendor-assets',
	'vendor-optimized-assets',
	'node-modules',
	'static',
]);

gulp.task('build-theme-files', ['styles', 'styles-done', 'images', 'static']);

// watch and run corresponding task on change, process changed files only
gulp.task('watch', ['build-all'], () => {
	const watchOptions = { interval: 1000 };
	gulp.watch(baseScripts, watchOptions, ['base-scripts']);
	gulp.watch(
		withTheme('./static/styles/**/*.{css,sass,scss}'),
		watchOptions,
		['styles', 'styles-done'],
	);
	gulp.watch(withTheme('./static/images/**/*.*'), watchOptions, [
		'images',
	]).on('change', browserSync.reload);
	gulp.watch(withTheme(nonBaseScripts), watchOptions, [
		'scripts',
	]);

	gulp.watch(withTheme('./static/vendor-optimized/**/*.*'), watchOptions, [
		'vendor-optimized-assets',
	]);
	gulp.watch(withTheme('./static/*.*'), watchOptions, ['static']);
});

gulp.task('watch-reload', ['watch', 'browser-sync']);

gulp.task('browser-sync', ['nodemon'], () => {
	browserSync.init(null, {
		proxy: 'http://localhost:3100',
		open: false,
		port: 7000,
		ghostMode: false,
		reloadOnRestart: false,
		socket: {
			clients: {
				heartbeatTimeout: 60000,
			},
		},
	});
});

gulp.task('nodemon', (cb) => {
	let started = false;
	return nodemon({
		ext: 'js hbs json',
		script: './bin/www',
		watch: ['views/', 'controllers/', 'helpers'],
		exec: 'node --inspect=9310',
	}).on('start', () => {
		if (!started) {
			cb();
			started = true;
		}
		setTimeout(browserSync.reload, 3000); // server-start takes some time
	});
});

// run this if only 'gulp' is run on the commandline with no task specified
gulp.task('default', ['build-all']);
