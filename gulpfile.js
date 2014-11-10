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
  , plumber = require('gulp-plumber')
  , htmlreplace = require('gulp-html-replace')
  , bowerFiles = require('main-bower-files')
  , glob = require('glob')
  ;

var express = require('express')
  , http = require('http')
  , app = express();

app.use(express.static(__dirname));

var settings = {
  port: 3000,
  dev: '.',
  js: ['main.js', 'modules/**/*.js', 'apps/**/*.js'],
  styles: {
    src: ['less/style.less', 'apps/**/*.less', 'modules/**/*.less'],
    includes: 'less/',
    dest: 'css'
  },
  html: 'index.html'
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
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    ;
});

gulp.task('scripts', function () {
  return gulp.src(settings.js, { cwd: settings.dev })
    .pipe(plumber())
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
    .pipe(plumber())
    .pipe(less({ paths: [path.join(settings.dev, settings.styles.includes)] }))
    .pipe(concat('style.css'))
    .pipe(prefix())
    .pipe(gulp.dest(path.join(settings.dev, settings.styles.dest)))
    ;
});

gulp.task('html', ['scripts'], function () {
  // Gather a list of all bower components installed.
  // We are only interested in JS files since we intend to import all the css files manually through
  // less import.
  var components = bowerFiles({
    filter: /\.js/
  }).map(function (file) {
    return path.relative('.', file);
  });

  // Gathering a list of all the modules we have.
  var modules = settings.js.map(function (pattern) {
    return glob.sync(pattern);
  }).reduce(function(a, b) {
    return a.concat(b);
  });

  return gulp.src('index.html')
    .pipe(plumber())
    .pipe(htmlreplace({
      components: components,
      modules: modules
    }, {
      // Keep blocks in place to be able to reuse the same filename over and over.
      keepUnassigned: true,
      keepBlockTags: true
    }))
    .pipe(gulp.dest('.'))
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
      cb(e);
    })
    .on('end', function () {
      util.log('E2E test finished successfully');
      cb();
    });
});


gulp.task('watch', function () {
  gulp.watch(settings.js, ['scripts', 'html']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});

gulp.task('build', ['gulphint', 'scripts', 'font', 'styles', 'html']);
gulp.task('default', ['build', 'watch', 'serve']);
