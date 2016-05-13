'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)

  , argv = require('yargs').argv
  ;

gulp.task('integration', ['build', 'serve'], function () {
  return gulp.src(argv['test-files'] || settings.tests, {read: false})
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: 'dot',
      compilers: {
        js: require('babelify/node_modules/babel-core/register')(settings.babel)
      }
    }))
    .on('end', function () {
      var tasks = require('.');
      tasks.serve.emit('kill');
    });
});
