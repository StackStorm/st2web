'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

const argv = require('yargs').argv;

gulp.task('unit', (done) => gulp.src(argv['test-files'] || settings.units, {read: false})
  .pipe(plugins.plumber())
  .pipe(plugins.mocha({
    reporter: 'dot',
    require: [
      'babel-core/register',
      'ignore-styles',
    ],
  }))
  .on('end', () => done())
  .on('error', (err) => done(err))
);
