'use strict';

var gulp = require('gulp')
  , settings = require('../../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)
  ;

var server;

gulp.task('serve-production', ['production'], function () {
  server = gulp.src('./build')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000
    }));

  return server;
});
