'use strict';

var gulp = require('gulp');
var fwdRef = require('undertaker-forward-reference');

gulp.registry(fwdRef());

var requireDir = require('require-dir');
module.exports = requireDir('./', { recurse: true });
