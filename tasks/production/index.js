'use strict';

const gulp = require('gulp');
const requireDir = require('require-dir');

module.exports = requireDir('./', { recurse: true });

gulp.task('production', gulp.series([
  'production-environment',
  'production-scripts',
  'production-styles',
  'production-static',
]));
