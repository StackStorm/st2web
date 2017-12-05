'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

let server;

gulp.task('serve', () => {
  server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000,
    }));

  return server;
});
