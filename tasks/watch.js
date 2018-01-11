'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');

gulp.task('watch', gulp.series([ 'watchify' ], (done) => {
  gulp.watch(settings.lint);
  done();
}));
