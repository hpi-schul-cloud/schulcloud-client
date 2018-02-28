const gulp = require('gulp')
const sass = require('gulp-sass')
const sassGrapher = require('gulp-sass-grapher');
const path = require('path');
const rimraf = require('gulp-rimraf')
const uglify = require('gulp-uglify')
const cleancss = require('clean-css')
const map = require('vinyl-map')
const imagemin = require('gulp-imagemin')
const babel = require('gulp-babel')
const filelog = require('gulp-filelog')
const plumber = require('gulp-plumber')
const optimizejs = require('gulp-optimize-js')
const concat = require('gulp-concat')
const count = require('gulp-count')
const changed = require('gulp-changed-smart')
const autoprefixer = require('gulp-autoprefixer')
const header = require('gulp-header');
const cCSS = new cleancss()
const fs = require('fs')
const gulpif = require('gulp-if');
//wrapped in a function so it works with gulp.watch (+consistency)
const minify = () => map((buff, filename) =>
    cCSS.minify(buff.toString()).styles)

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
]

const nonBaseScripts = ['./static/scripts/**/*.js']
    .concat(baseScripts.map(script => '!' + script))

//used by all gulp tasks instead of gulp.src(...)
//plumber prevents pipes from stopping when errors occur
//changed only passes on files that were modified since last time
//filelog logs and counts all processed files

function withTheme(src){
    if(typeof src == "string"){
        return [src, `./theme/${themeName()}/${src.slice(2)}`];
    }else{
        return src.concat(src.map(e => {
            return `./theme/${themeName()}/${e.slice(2)}`;
        }));
    }
}

const beginPipe = src =>
    gulp.src(withTheme(src))
        .pipe(plumber())
        .pipe(changed(gulp))
        .pipe(filelog())

const beginPipeAll = src =>
    gulp.src(withTheme(src))
        .pipe(plumber())
        .pipe(filelog())

//minify images
gulp.task('images', () => {
    beginPipe('./static/images/**/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/images'))
})

function themeName(){
    return process.env.SC_THEME || 'default';
}

var loadPaths = path.resolve('./static/styles/');
sassGrapher.init('./static/styles/', { loadPaths: loadPaths });
gulp.task('styles', () => {
    var themeFile = `./theme/${themeName()}/style.scss`;
    beginPipe('./static/styles/**/*.{css,sass,scss}')
        .pipe(sassGrapher.ancestors())
        .pipe(header(fs.readFileSync(themeFile, 'utf8'))) // READ: https://github.com/schul-cloud/schulcloud-client/pull/588
        .pipe(filelog("PROCESS: "))
        .pipe(sass({sourceMap: false}))
        .pipe(minify())
        .pipe(autoprefixer({ browsers: ['last 3 major versions'] }))
        .pipe(gulp.dest('./build/styles'))
})

//copy fonts
gulp.task('fonts', () => {
    beginPipe('./static/fonts/**/*.*')
        .pipe(gulp.dest('./build/fonts'))
})

//compile/transpile JSX and ES6 to ES5 and minify scripts
gulp.task('scripts', () => {
    beginPipe(nonBaseScripts)
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(gulp.dest('./build/scripts'))
})


//compile/transpile JSX and ES6 to ES5, minify and concatenate base scripts into all.js
gulp.task('base-scripts', () => {
    beginPipeAll(baseScripts)
        .pipe(count('## js-files selected'))
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(concat('all.js'))
        .pipe(gulp.dest('./build/scripts'))
})

//compile vendor SASS/SCSS to CSS and minify it
gulp.task('vendor-styles', () => {
    beginPipe('./static/vendor/**/*.{css,sass,scss}')
        .pipe(sass())
        .pipe(minify())
        .pipe(autoprefixer({ browsers: ['last 3 major versions'] }))
        .pipe(gulp.dest('./build/vendor'))
})

//compile/transpile vendor JSX and ES6 to ES5 and minify scripts
gulp.task('vendor-scripts', () => {
    beginPipe('./static/vendor/**/*.js')
        .pipe(babel({
            compact: false,
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(gulp.dest('./build/vendor'))
})

//copy other vendor files
gulp.task('vendor-assets', () => {
    beginPipe(['./static/vendor/**/*.*', '!./static/vendor/**/*.js',
        '!./static/vendor/**/*.{css,sass,scss}'])
        .pipe(gulp.dest('./build/vendor'))
})

//clear build folder + smart cache
gulp.task('clear', () => {
    gulp.src(['./build/*', './.gulp-changed-smart.json'], { read: false })
        .pipe(rimraf())
})

//run all tasks, processing changed files
gulp.task('build-all', ['images', 'styles', 'fonts', 'scripts', 'base-scripts',
                        'vendor-styles', 'vendor-scripts', 'vendor-assets'])

//watch and run corresponding task on change, process changed files only
gulp.task('watch', ['build-all'], () => {
    gulp.watch(withTheme('./static/images/**/*.*'), ['images'])
    gulp.watch(withTheme('./static/styles/**/*.{css,sass,scss}'), ['styles'])
    gulp.watch(withTheme('./static/fonts/**/*.*'), ['fonts'])
    gulp.watch(withTheme(nonBaseScripts), ['scripts'])
    gulp.watch(withTheme(baseScripts), ['base-scripts'])
    gulp.watch(withTheme('./static/vendor/**/*.{css,sass,scss}'), ['vendor-styles'])
    gulp.watch(withTheme('./static/vendor/**/*.js'), ['vendor-scripts'])
    gulp.watch(['./static/vendor/**/*.*', '!./static/vendor/**/*.js',
                '!./static/vendor/**/*.{css,sass,scss}'], ['vendor-assets'])
})

//run this if only "gulp" is run on the commandline with no task specified
gulp.task('default', ['build-all'])
