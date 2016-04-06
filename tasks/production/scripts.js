'use strict';

var gulp = require('gulp')
  , settings = require('../../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)
  ;

gulp.task('production-scripts', ['browserify'], function () {
  return gulp.src(settings.production.scripts, { base: __dirname + '/../..' })
    .pipe(plugins.uglify({
      mangle: false,
      compress: {
        keep_fnames: true
      }
    }))
    .pipe(gulp.dest(settings.production.dest))
    .pipe(plugins.size({
      showFiles: true
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true
    }));
});
