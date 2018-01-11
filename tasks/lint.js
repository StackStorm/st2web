'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('lint', () => gulp.src(settings.lint, { cwd: settings.dev })
  .pipe(plugins.plumber())
  .pipe(plugins.eslint())
  .pipe(plugins.eslint.format())
);
