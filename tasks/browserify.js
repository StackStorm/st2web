'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);
const path = require('path');
const fs = require('fs');

const _ = require('lodash');
const git = require('git-rev-sync');
const pkg = require('./package.json');
const es = require('event-stream');
const browserify = require('browserify');
const watchify = require('watchify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const cssExtract = require('css-extract');

function buildHeader() {
  const host = 'https://github.com/';
  const commitURL = `${host + pkg.repository}/commit/${git.long()}`;

  return `Built ${new Date().toISOString()} from ${commitURL}`;
}

function bundle(file, name) {
  const customOpts = {
    fullPaths: true,
    entries: [ file ],
    transform: pkg.browserify.transform,
    debug: true,
  };
  const opts = _.assign({}, watchify.args, customOpts);

  const b = !global.watch ? browserify(opts) : watchify(browserify(opts), { poll: 100 })
    .on('update', () => {
      bundle(file, name)
        .pipe(plugins.size({
          showFiles: true,
        }))
        .pipe(plugins.size({
          showFiles: true,
          gzip: true,
        }))
      ;
    });

  b
    .plugin(cssExtract, { out: path.join(settings.styles.dest, 'style.css')})
    .on('log', plugins.util.log)
  ;

  fs.mkdir(settings.styles.dest, () => { /* noop */ });

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
    .pipe(plugins.header(`/* ${buildHeader()} */`))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('js/'))
  ;
}

gulp.task('browserify', () => {
  const tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks)
    .pipe(plugins.size({
      showFiles: true,
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true,
    }))
  ;
});

gulp.task('watchify', () => {
  global.watch = true;

  const tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks)
    .pipe(plugins.size({
      showFiles: true,
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true,
    }))
  ;
});
