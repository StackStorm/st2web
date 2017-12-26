'use strict';

const gulp = require('gulp');
const settings = require('../settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

const argv = require('yargs').argv;

gulp.task('test-production', gulp.series([ 'production' ], (done) => {
  const server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3002,
    }));

  plugins.env({
    vars: {
      PORT: 3002,
    },
  });

  return gulp.src(argv['test-files'] || settings.production.tests, { read: false })
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: 'dot',
      require: [
        'babel-register',
      ],
    }))
    .on('end', () => {
      server.emit('kill');
      return done();
    })
    .on('error', (err) => done(err));
}));
