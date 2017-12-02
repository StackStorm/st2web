'use strict';

var gulp = require('gulp')
  , settings = require('./settings.json')
  ;

gulp.task('watch', gulp.series(['watchify'], function watching(done) {
  gulp.watch(settings.lint);
  done();
}));
