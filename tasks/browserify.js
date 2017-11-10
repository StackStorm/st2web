'use strict';

var gulp = require('gulp')
  , settings = require('./settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)
  , path = require('path')
  , fs = require('fs')

  , _ = require('lodash')
  , git = require('git-rev-sync')
  , pkg = require('./package.json')
  , es = require('event-stream')
  , browserify = require('browserify')
  , watchify = require('watchify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , cssExtract = require('css-extract')
  ;

function buildHeader() {
  var host = 'https://github.com/'
    , commitURL = host + pkg.repository + '/commit/' + git.long()
    ;

  return 'Built ' + new Date().toISOString() + ' from ' + commitURL;
}

function bundle(file, name) {
  var customOpts = {
    fullPaths: true,
    entries: [file],
    transform: pkg.browserify.transform,
    debug: true
  };
  var opts = _.assign({}, watchify.args, customOpts);

  var b = !global.watch ? browserify(opts) : watchify(browserify(opts), { poll: 100 })
    .on('update', function () {
      bundle(file, name)
        .pipe(plugins.size({
          showFiles: true
        }))
        .pipe(plugins.size({
          showFiles: true,
          gzip: true
        }))
      ;
    });

  b
    .plugin(cssExtract, { out: path.join(settings.styles.dest, 'style.css')})
    .on('log', plugins.util.log)
  ;

  fs.mkdir(settings.styles.dest, function () { /* noop */ });

  return b.bundle()
    .on('error', function (error) {
      plugins.util.log(
        plugins.util.colors.cyan('Browserify') + plugins.util.colors.red(' found unhandled error:\n'),
        error.toString()
      );
      this.emit('end');
    })
    .pipe(source(name))
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.header('/* ' + buildHeader() + ' */'))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('js/'))
  ;
}

gulp.task('browserify', function () {
  var tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks)
    .pipe(plugins.size({
      showFiles: true
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true
    }))
  ;
});

gulp.task('watchify', function () {
  global.watch = true;

  var tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks)
    .pipe(plugins.size({
      showFiles: true
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true
    }))
  ;
});
