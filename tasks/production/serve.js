'use strict';

var gulp = require('gulp');
var settings = require('../settings.json');
var plugins = require('gulp-load-plugins')(settings.plugins);

var server;

gulp.task('serve-production', gulp.series(['production'], function productionServing() {
  server = gulp.src('./build')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000,
    }));

  return server;
}));
