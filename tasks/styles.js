'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)

  , path = require('path')
  ;

gulp.task('styles', function () {
  return gulp.src(settings.styles.src, { base: settings.dev })
    .pipe(plugins.plumber())
    .pipe(plugins.csscomb())
    .pipe(gulp.dest(settings.dev))
    .pipe(plugins.less({ paths: [path.join(settings.dev, settings.styles.includes)] }))
    .pipe(plugins.concat('style.css'))
    .pipe(plugins.autoprefixer())
    .pipe(gulp.dest(path.join(settings.dev, settings.styles.dest)))
    ;
});
