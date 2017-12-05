'use strict';

var gulp = require('gulp')
  ;

gulp.task('test', gulp.series([
  'unit',
  'functional',
]));
