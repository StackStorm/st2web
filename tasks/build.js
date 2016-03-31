'use strict';

var gulp = require('gulp')
  ;

gulp.task('build', ['gulphint', 'lint', 'styles', 'browserify']);
