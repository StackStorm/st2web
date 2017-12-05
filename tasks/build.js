'use strict';

const gulp = require('gulp');

gulp.task('build', gulp.series([ 'lint', 'browserify' ]));
