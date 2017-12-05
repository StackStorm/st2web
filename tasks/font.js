'use strict';

const gulp = require('gulp');
const fontelloUpdate = require('fontello-update');

gulp.task('font', () => fontelloUpdate({
  config: 'fontello.json',
  fonts: 'font',
  css: 'font',
}));
