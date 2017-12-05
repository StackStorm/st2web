'use strict';

const gulp = require('gulp');
const settings = require('../settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('production-libs', () => gulp.src(settings.production.libs, { base: `${__dirname}/../..` })
  .pipe(plugins.rename((path) => {
    path.basename = path.basename.split('.')[0];
  }))
  .pipe(gulp.dest(settings.production.dest))
);
