'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  ;

gulp.task('watch', ['watchify'], function () {
  gulp.watch(settings.lint, ['lint']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});
