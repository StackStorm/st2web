'use strict';

const gulp = require('gulp');
const fwdRef = require('undertaker-forward-reference');

gulp.registry(fwdRef());

const requireDir = require('require-dir');
module.exports = requireDir('./', { recurse: true });
