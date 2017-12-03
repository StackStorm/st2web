'use strict';

var gulp = require('gulp');
var npmShrinkwrap = require('npm-shrinkwrap');

gulp.task('shrinkwrap', function (cb) {
  npmShrinkwrap({
    dev: true,
    dirname: __dirname + '/..',
  }, cb);
});
