'use strict';

var gulp = require('gulp')
  , settings = require('../../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)

  , argv = require('yargs').argv
  ;

gulp.task('test-production', ['production', 'serve-production'], function () {
  return gulp.src(argv['test-files'] || settings.production.tests, { read: false })
    .pipe(plugins.mocha({
      reporter: 'dot'
    }))
    .on('end', function () {
      var production = require('.');
      production.serve.emit('kill');
    });
});
