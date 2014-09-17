/* jshint node: true */
'use strict';

var gulp = require('gulp')
  , jshint = require('gulp-jshint')
  , path = require('path')
  , es = require('event-stream')
  , less = require('gulp-less')
  , concat = require('gulp-concat')
  , util = require('gulp-util')
  , prefix = require('gulp-autoprefixer')
  , fontelloUpdate = require('fontello-update')
  , protractor = require('gulp-protractor').protractor
  ;

var express = require('express')
  , http = require('http')
  , app = express();

app.use(express.static(__dirname));

var settings = {
  port: 3000,
  dev: '.',
  js: ['apps/**/*.js', 'modules/**/*.js', 'main.js'],
  styles: {
    src: ['less/style.less', 'apps/**/*.less', 'modules/**/*.less'],
    includes: 'less/',
    dest: 'css'
  },
  html: 'index.html',
  apiBlueprint: '../apiary.apib'
};


var debug = function () {
  return es.through(function write(data) {
    console.log('WRITE:', data ? data.path : '');
    console.log(data ? data.contents.toString() : '');
    this.emit('data', data);
  }, function end(data) {
    console.log('END:', data ? data.path : '');
    console.log(data ? data.contents.toString() : '');
    this.emit('end', data);
  });
};

debug();


gulp.task('gulphint', function () {
  return gulp.src('gulpfile.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    ;
});

gulp.task('scripts', function () {
  return gulp.src(settings.js, { cwd: settings.dev })
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    ;
});

gulp.task('font', function () {
  return fontelloUpdate({
    config: 'fontello.json',
    fonts: 'font',
    css: 'font'
  });
});

gulp.task('styles', ['font'], function () {
  return gulp.src(settings.styles.src, { cwd: settings.dev })
    .pipe(less({ paths: [path.join(settings.dev, settings.styles.includes)] }))
    .on('error', function(err) {
      console.warn(err.message);
    })
    .pipe(concat('style.css'))
    .pipe(prefix())
    .pipe(gulp.dest(path.join(settings.dev, settings.styles.dest)))
    ;
});

gulp.task('serve', ['build'], function (cb) {
  http
    .createServer(app)
    .listen(settings.port, function () {
      util.log('Server started on', settings.port, 'port');
      cb();
    })
    .on('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        util.log('Port', settings.port, 'is already taken by another process');
        cb();
      } else {
        cb(err);
      }
    })
    .unref();
});

gulp.task('test', ['build', 'serve'], function (cb) {
  gulp.src(['./tests/*.js'])
    .pipe(protractor({
      configFile: 'protractor.js',
      args: ['--baseUrl', 'http://localhost:' + settings.port]
    }))
    .on('error', function (e) {
      util.log('E2E test failed:', e.message);
      cb();
    })
    .on('end', function () {
      util.log('E2E test finished successfully');
      cb();
    });
});


gulp.task('watch', function () {
  gulp.watch(settings.js, ['scripts']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});

gulp.task('build', ['gulphint', 'scripts', 'font', 'styles']);
gulp.task('default', ['build', 'watch', 'serve', 'test']);
