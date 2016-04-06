'use strict';

var gulp = require('gulp')
  , requireDir = require('require-dir');

module.exports = requireDir('./', { recurse: true });

gulp.task('production', [
  'production-scripts',
  'production-styles',
  'production-libs',
  'production-static'
]);
