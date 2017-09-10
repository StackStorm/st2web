'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  ;

gulp.task('watch', gulp.series(['watchify'], function some(done) {
  gulp.watch(settings.lint, gulp.series(['lint']));
  gulp.watch(settings.styles.src.concat(settings.styles.includes), gulp.series(['styles']));
  done();
}));
