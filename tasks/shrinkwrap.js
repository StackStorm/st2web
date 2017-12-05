'use strict';

const gulp = require('gulp');
const npmShrinkwrap = require('npm-shrinkwrap');

gulp.task('shrinkwrap', (cb) => {
  npmShrinkwrap({
    dev: true,
    dirname: `${__dirname}/..`,
  }, cb);
});
