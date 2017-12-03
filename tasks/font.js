'use strict';

var gulp = require('gulp');
var fontelloUpdate = require('fontello-update');

gulp.task('font', function () {
  return fontelloUpdate({
    config: 'fontello.json',
    fonts: 'font',
    css: 'font',
  });
});
