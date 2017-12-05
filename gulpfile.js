const gulp = require('gulp');
const sass = require('gulp-sass');
const rimraf = require('gulp-rimraf');
const uglify = require('gulp-uglify');
const cleanCSS = require('clean-css');
const map = require('vinyl-map');
const imagemin = require('gulp-imagemin');
const babel = require('gulp-babel');
const filelog = require('gulp-filelog');
const plumber = require('gulp-plumber');
const watch = require('gulp-watch');
const optimizejs = require('gulp-optimize-js');
const concat = require('gulp-concat');
const count = require('gulp-count');

const baseScripts = [
    './static/scripts/jquery/jquery.min.js',
    './static/scripts/jquery/jquery.serialize-object.js',
    './static/scripts/tether/tether.min.js',
    './static/scripts/bootstrap/bootstrap.min.js',
    './static/scripts/chosen/chosen.jquery.min.js',
    './static/scripts/base.js',
    './static/scripts/toggle/bootstrap-toggle.min.js',
    './static/scripts/mailchimp/mailchimp.js',
    './static/scripts/qrcode/kjua-0.1.1.min.js'
];

/**
 * Initialize a new gulp task for a given src and optionally watch it
 * @param {string|Array} src - Path to the directory.
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns gulp instance
 */
const getGulpTask = (src, isWatch = false) => {
    let task = gulp.src(src);
    if(isWatch) {
        task = task.pipe(watch(src, {interval: 1000, usePolling: true}));
    }
    return task
        .pipe(filelog())
        .pipe(plumber());
};

/**
 * Minify images
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildImages = (isWatch) => {
    return getGulpTask('./static/images/**/*.*', isWatch)
        .pipe(imagemin())
        .pipe(gulp.dest('./build/images'))
};

/**
 * Compile SASS/SCSS to CSS and minify it
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildStyles = (isWatch) => {
    const minify = map(function (buff, filename) {
        return new cleanCSS().minify(buff.toString()).styles;
    });

    return getGulpTask('./static/styles/**/*.{css,sass,scss}', isWatch)
        .pipe(sass())
        .pipe(minify)
        .pipe(gulp.dest('./build/styles'))
};


/**
 * Copy fonts to build folder
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildFonts = (isWatch) => {
    return getGulpTask('./static/fonts/**/*.*', isWatch)
        .pipe(gulp.dest('./build/fonts'))
};

/**
 * Copy vendor files to output folder
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildVendorImages = (isWatch) => {
    const minify = map(function (buff, filename) {
        return new cleanCSS().minify(buff.toString()).styles;
    });

    return getGulpTask('./static/vendor/**/*.{css,sass,scss}', isWatch)
        .pipe(sass())
        .pipe(minify)
        .pipe(gulp.dest('./build/vendor'))
};

/**
 * Copy vendor files to output folder
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildVendorScripts = (isWatch) => {
    return getGulpTask('./static/vendor/**/*.js', isWatch)
        .pipe(babel({
            compact: false,
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(gulp.dest('./build/vendor'))
        .on('error', catchError)
};

/**
 * Copy vendor files to output folder
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildVendorAssets = (isWatch) => {
    return getGulpTask(['./static/vendor/**/*.*', '!./static/vendor/**/*.js', '!./static/vendor/**/*.{css,sass,scss}'], isWatch)
        .pipe(gulp.dest('./build/vendor'))
        .on('error', catchError)
};


/**
 * Compile/Transpile JSX and ES6 to ES5 and minify scripts.
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildScripts = (isWatch) => {
    return getGulpTask(['./static/scripts/**/*.js'].concat(baseScripts.map(script => '!' + script)), isWatch)
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(gulp.dest('./build/scripts'))
        .on('error', catchError)
};


/**
 * For "base scripts": Compile/Transpile JSX and ES6 to ES5 and minify scripts.
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildBaseScripts = (isWatch) => {
    return getGulpTask(baseScripts, false)
        .pipe(count('## js-files selected'))
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(concat('all.js'))
        .pipe(gulp.dest('./build/scripts'))
        .on('error', catchError)
};

/**
 * Prevent gulp from crashing when there are errors while bundling (e.g. in js-files)
 * @param error {Error} - the error which is thrown and has to be handled
 */
const catchError = (error) => {
    console.log(error.toString());
};

/**
 * Clear build folder
 * @returns populated gulp instance
 */
gulp.task('clean', function() {
    return gulp.src('./build/*', { read: false }).pipe(rimraf());
});

/**
 * Run all the tasks and pass isWatch to them
 * @param {boolean} isWatch - To watch or not to watch.
 */
const getGulpTasks = (isWatch = false) => {
    buildImages(isWatch);
    buildStyles(isWatch);
    buildFonts(isWatch);
    buildScripts(isWatch);
    buildBaseScripts(isWatch);
    buildVendorImages(isWatch);
    buildVendorScripts(isWatch);
    buildVendorAssets(isWatch);
};

gulp.task('watch', ['clean'], getGulpTasks.bind(this, true));
gulp.task('default', ['clean'], getGulpTasks.bind(this, false));
