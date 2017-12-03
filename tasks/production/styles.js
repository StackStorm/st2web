'use strict';

var gulp = require('gulp');
var settings = require('../settings.json');
var plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('production-styles', function productionStyling() {
  return gulp.src(settings.production.styles, { base: __dirname + '/../..' })
    .pipe(gulp.dest(settings.production.dest))
    .pipe(plugins.size({
      showFiles: true,
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true,
    }));
});
