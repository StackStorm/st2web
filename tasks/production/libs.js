'use strict';

var gulp = require('gulp');
var settings = require('../settings.json');
var plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('production-libs', function () {
  return gulp.src(settings.production.libs, { base: __dirname + '/../..' })
    .pipe(plugins.rename(function (path) {
      path.basename = path.basename.split('.')[0];
    }))
    .pipe(gulp.dest(settings.production.dest))
  ;
});
