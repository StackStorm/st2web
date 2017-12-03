'use strict';

var gulp = require('gulp');
var settings = require('./settings.json');
var plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('lint', function () {
  return gulp.src(settings.lint, { cwd: settings.dev })
    .pipe(plugins.plumber())
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
  ;
});
