'use strict';

var gulp = require('gulp');
var settings = require('./settings.json');

gulp.task('watch', gulp.series(['watchify'], function watching(done) {
  gulp.watch(settings.lint);
  done();
}));
