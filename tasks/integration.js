'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)

  , argv = require('yargs').argv
  ;

gulp.task('integration', gulp.series(['build'], function integrating() {
  var server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3001
    }));

  plugins.env({
    vars: {
      PORT: 3001
    }
  });

  return gulp.src(argv['test-files'] || settings.tests, {read: false})
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: 'dot',
      compilers: {
        js: require('babel-core/register')
      }
    }))
    .on('end', function () {
      server.emit('kill');
    });
}));
