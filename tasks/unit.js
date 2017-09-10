'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)

  , argv = require('yargs').argv
  ;

gulp.task('unit', function (done) {
  return gulp.src(argv['test-files'] || settings.units, {read: false})
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: 'dot',
      compilers: {
        js: require('babel-core/register')
      }
    }))
    .on('end', function () {
      return done();
    })
    .on('error', function (err) {
      return done(err);
    });
    ;
});
