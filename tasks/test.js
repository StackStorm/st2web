'use strict';

const gulp = require('gulp');

gulp.task('test', gulp.series([
  'test-unit',
  'test-functional',
]));
