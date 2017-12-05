'use strict';

const gulp = require('gulp');

gulp.task('test', gulp.series([
  'unit',
  'functional',
]));
