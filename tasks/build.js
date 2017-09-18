'use strict';

var gulp = require('gulp')
  ;

gulp.task('build', gulp.series(['lint', 'browserify']));
