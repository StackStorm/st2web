'use strict';

var gulp = require('gulp')
  , requireDir = require('require-dir');

module.exports = requireDir('./', { recurse: true });

gulp.task('production', gulp.series([
  'production-scripts',
  'production-styles',
  'production-libs',
  'production-static',
]));
