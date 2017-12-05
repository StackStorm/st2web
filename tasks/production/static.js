'use strict';

const gulp = require('gulp');
const settings = require('../settings.json');

gulp.task('production-static', () => gulp.src(settings.production.static, { base: `${__dirname}/../..` })
  .pipe(gulp.dest(settings.production.dest))
);
