const gulp = require('gulp');
const sass = require('gulp-sass');
const rimraf = require('gulp-rimraf');
const uglify = require('gulp-uglify');
const cleanCSS = require('clean-css');
const map = require('vinyl-map');
const imagemin = require('gulp-imagemin');
const babel = require('gulp-babel');
const filelog = require('gulp-filelog');
const watch = require('gulp-watch');

/**
 * Initialize a new gulp task for a given src and optionally watch it
 * @param {string} src - Path to the directory.
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns gulp instance
 */
const getGulpTask = (src, isWatch = false) => {
    let task = gulp.src(src);
    if(isWatch) {
        task = task.pipe(watch(src));
    }
    return task.pipe(filelog());
}

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
 * TODO: minify js and css
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildVendor = (isWatch) => {
    return getGulpTask('./static/vendor/**/*.*', isWatch)
        .pipe(gulp.dest('./build/vendor'))
};

/**
 * Compile/Transpile JSX and ES6 to ES5 and minify scripts.
 * @param {boolean} isWatch - To watch or not to watch.
 * @returns populated gulp instance
 */
const buildScripts = (isWatch) => {
    return getGulpTask('./static/scripts/**/*.js', isWatch)
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./build/scripts'))
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
    buildVendor(isWatch);
};

gulp.task('watch', ['clean'], getGulpTasks.bind(this, true));
gulp.task('default', ['clean'], getGulpTasks.bind(this, false));
