/* jshint node: true */
'use strict';

var gulp = require('gulp')
  , es = require('event-stream')
  , settings = require('./settings.json')
  ;

require('./tasks');

var debug = function () {
  return es.through(function write(data) {
    console.log('WRITE:', data);
    //console.log(data ? data.contents.toString() : '');
    this.emit('data', data);
  }, function end(data) {
    console.log('END:', data);
    //console.log(data ? data.contents.toString() : '');
    this.emit('end', data);
  });
};

debug();


gulp.task('watch', ['watchify'], function () {
  gulp.watch(settings.js, ['lint']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});

gulp.task('build', ['gulphint', 'lint', 'styles', 'browserify']);
gulp.task('default', ['gulphint', 'lint', 'styles', 'watch', 'serve']);
