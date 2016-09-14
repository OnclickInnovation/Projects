'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var rename = require('gulp-rename');
var htmlreplace = require('gulp-html-replace');
var jeditor = require("gulp-json-editor");

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('partials', function ()
{
  return gulp.src([
    path.join(conf.paths.src, '/app/**/*.html'),
    path.join(conf.paths.tmp, '/serve/app/**/*.html')
  ])
  .pipe($.minifyHtml({
    empty : true,
    spare : true,
    quotes: true
  }))
  .pipe($.angularTemplatecache('templateCacheHtml.js', {
    module: 'fuse',
    root  : 'app'
  }))
  .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('html', ['inject', 'partials'], function ()
{
  var partialsInjectFile = gulp.src(path.join(conf.paths.tmp, '/partials/templateCacheHtml.js'), {read: false});
  var partialsInjectOptions = {
    starttag    : '<!-- inject:partials -->',
    ignorePath  : path.join(conf.paths.tmp, '/partials'),
    addRootSlash: false
  };

  var htmlFilter = $.filter('*.html', {restore: true});
  var jsFilter = $.filter('**/*.js', {restore: true});
  var cssFilter = $.filter('**/*.css', {restore: true});

  var assets;

  return gulp.src(path.join(conf.paths.tmp, '/serve/*.html'))
  .pipe($.inject(partialsInjectFile, partialsInjectOptions))
  .pipe(assets = $.useref.assets())
  .pipe($.rev())
  .pipe(jsFilter)
  .pipe($.sourcemaps.init())
  .pipe($.ngAnnotate())
  .pipe($.uglify({preserveComments: $.uglifySaveLicense})).on('error', conf.errorHandler('Uglify'))
  .pipe(rename(function (path) {
    path.basename = path.basename.split('-')[0] + '.min';
  }))
  // .pipe($.sourcemaps.write('maps'))
  .pipe(jsFilter.restore)
  .pipe(cssFilter)
  .pipe($.sourcemaps.init())
  .pipe($.minifyCss({processImport: false}))
  .pipe(rename(function (path) {
    path.basename = path.basename.split('-')[0] + '.min';
  }))
  // .pipe($.sourcemaps.write('maps'))
  .pipe(cssFilter.restore)
  .pipe(assets.restore())
  .pipe($.useref())
  .pipe($.revReplace())
  .pipe(htmlFilter)
  .pipe(htmlreplace({
    baseReplace: {
      src: '/',
      tpl: '<base href="%s">'
    }
  }))
  .pipe($.minifyHtml({
    empty       : true,
    spare       : true,
    quotes      : true,
    conditionals: true
  }))
  .pipe(htmlFilter.restore)
  .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
  .pipe($.size({
    title    : path.join(conf.paths.dist, '/'),
    showFiles: true
  }));
});

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
gulp.task('fonts', function ()
{
  return gulp.src($.mainBowerFiles())
  .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
  .pipe($.flatten())
  .pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/')));
});

gulp.task('other', function ()
{
  var fileFilter = $.filter(function (file)
  {
    return file.stat.isFile();
  });

  return gulp.src([
    path.join(conf.paths.src, '/**/*'),
    path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss}'),
    path.join('!' + conf.paths.src, '/config.json'),
    path.join('!' + conf.paths.src, '/NodeService{,/**}')
  ])
  .pipe(fileFilter)
  .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('angular-locale', function ()
{
  var fileFilter = $.filter(function (file)
  {
    return file.stat.isFile();
  });

  return gulp.src([
    path.join(conf.paths.src, '/angular/i18n/*.js')
  ])
  .pipe(gulp.dest(path.join(conf.paths.dist, '/angular/i18n/')));
});

gulp.task('assets', function ()
{
  var fileFilter = $.filter(function (file)
  {
    return file.stat.isFile();
  });

  return gulp.src([
    path.join(conf.paths.src, '/assets/**/*')
  ])
  .pipe(gulp.dest(path.join(conf.paths.dist, '/assets/')));
});

gulp.task('clean', function ()
{
  return $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')]);
});

gulp.task('config', function() {
  return gulp.src([
    path.join(conf.paths.src, '/config.json')
  ])
  .pipe(jeditor({
    "serviceURL": "https://"+conf.paths.production_ip,
    "userTimeout": 30
  }))
  .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('build', ['html', 'other', 'fonts', 'angular-locale', 'assets', 'config']);
