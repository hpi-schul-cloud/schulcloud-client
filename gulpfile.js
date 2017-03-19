const gulp = require('gulp');
const sass = require('gulp-sass');
const rimraf = require('gulp-rimraf');
const uglify = require('gulp-uglify');
const cleanCSS = require('clean-css');
const map = require('vinyl-map');
const imagemin = require('gulp-imagemin');

const buildImages = () => {
    return gulp.src('./static/images/**/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/images'))
};

gulp.task('watch-images', function () {
    return gulp.watch('./static/images/**/*.*', function (cb) {
        buildImages(cb);
    });
});

const buildStyles = () => {
    const minify = map(function (buff, filename) {
        return new cleanCSS().minify(buff.toString()).styles;
    });

    return gulp.src('./static/styles/**/*.{css,sass,scss}')
        .pipe(sass())
        .pipe(minify)
        .pipe(gulp.dest('./build/styles'))
};

gulp.task('watch-styles', function () {
    return gulp.watch('./static/styles/**/*.{css,sass,scss}', function (cb) {
        buildStyles(cb);
    });
});

const buildFonts = () => {
    return gulp.src('./static/fonts/**/*.*')
        .pipe(gulp.dest('./build/fonts'))
};

gulp.task('watch-fonts', function () {
    return gulp.watch('./static/fonts/**/*.*', function (cb) {
        buildFonts(cb);
    });
});


const buildScripts = (cb) => {
    gulp.src('./static/scripts/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./build/scripts'))
};


gulp.task('watch-scripts', function () {
    return gulp.watch('./static/scripts/**/*.js', function (cb) {
        buildScripts(cb);
    });
});


gulp.task('clean', function() {
    return gulp.src('./build/*', { read: false }).pipe(rimraf());
});

/* Main Tasks */
gulp.task('watch', [
    'default',
    'watch-images',
    'watch-styles',
    'watch-fonts',
    'watch-scripts'
]);

gulp.task('default', ['clean'], function () {
    buildImages();
    buildStyles();
    buildFonts();
    buildScripts();
});