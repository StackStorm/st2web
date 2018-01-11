'use strict';

const gulp = require('gulp');
const settings = require('../settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('production-styles', () =>
  gulp.src(settings.production.styles, { base: '.' })
    .pipe(gulp.dest(settings.production.dest))
    .pipe(plugins.size({
      showFiles: true,
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true,
    }))
);
