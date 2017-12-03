'use strict';

var gulp = require('gulp');
var settings = require('../settings.json');

gulp.task('production-static', function () {
  return gulp.src(settings.production.static, { base: __dirname + '/../..' })
    .pipe(gulp.dest(settings.production.dest))
  ;
});
