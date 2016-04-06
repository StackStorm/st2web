'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)
  ;

gulp.task('lint', function () {
  return gulp.src(settings.lint, { cwd: settings.dev })
    .pipe(plugins.plumber())
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    ;
});
