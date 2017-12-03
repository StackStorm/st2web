'use strict';

var gulp = require('gulp');
var settings = require('./settings.json');
var plugins = require('gulp-load-plugins')(settings.plugins);

var argv = require('yargs').argv;

gulp.task('unit', function (done) {
  return gulp.src(argv['test-files'] || settings.units, {read: false})
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: 'dot',
      compilers: {
        js: require('babel-core/register'),
      },
    }))
    .on('end', function () {
      return done();
    })
    .on('error', function (err) {
      return done(err);
    });
  ;
});
