'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

let server;

gulp.task('serve', () => {
  const st2host = process.env.ST2_HOST || '127.0.0.1';
  const options = {
    rejectUnauthorized: false,
  };

  server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000,
      https: true,
      proxies: [{
        source: '/api',
        target: `https://${st2host}/api`,
        options,
      }, {
        source: '/auth',
        target: `https://${st2host}/auth`,
        options,
      }, {
        source: '/stream',
        target: `https://${st2host}/stream`,
        options,
      }],
    }));

  return server;
});
