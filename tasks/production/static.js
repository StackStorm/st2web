'use strict';

const gulp = require('gulp');
const settings = require('../settings.json');

gulp.task('production-static', () =>
  gulp.src(settings.production.static, { base: '.' })
    .pipe(gulp.dest(settings.production.dest))
);
