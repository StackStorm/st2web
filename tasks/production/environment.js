'use strict';

const gulp = require('gulp');

gulp.task('production-environment', (done) => {
  process.env.NODE_ENV = 'production';
  done();
});
