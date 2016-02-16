/* jshint node: true */
'use strict';

var _ = require('lodash')
  , gulp = require('gulp')
  , jshint = require('gulp-jshint')
  , path = require('path')
  , es = require('event-stream')
  , less = require('gulp-less')
  , concat = require('gulp-concat')
  , webserver = require('gulp-webserver')
  , prefix = require('gulp-autoprefixer')
  , fontelloUpdate = require('fontello-update')
  , mocha = require('gulp-mocha')
  , plumber = require('gulp-plumber')
  , csscomb = require('gulp-csscomb')
  , uglify = require('gulp-uglify')
  , size = require('gulp-size')
  , header = require('gulp-header')
  , git = require('git-rev-sync')
  , pkg = require('./package.json')
  , yargs = require('yargs')
  , browserify = require('browserify')
  , watchify = require('watchify')
  , babelify = require('babelify')
  , gutil = require('gulp-util')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , sourcemaps = require('gulp-sourcemaps')
  , rename = require('gulp-rename')
  ;

var express = require('express')
  , server
  , argv = yargs.argv
  , app = express();

app.use(express.static(__dirname));

var settings = {
  port: 3000,
  dev: '.',
  js: ['main.js', 'modules/**/*.js', 'apps/**/*.js'],
  styles: {
    src: ['./less/style.less', './apps/**/*.less', './modules/**/*.less'],
    includes: 'less/',
    dest: 'css'
  },
  modules: {
    'main.js': 'main.js',
    'dependencies.js': 'dependencies.js',
    'apps.js': 'apps/index.js',
    'modules.js': 'modules/index.js'
  },
  html: 'index.html'
};


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

function buildHeader() {
  var host = 'https://github.com/'
    , commitURL = host + pkg.repository + '/commit/' + git.long()
    ;

  return 'Built ' + new Date().toISOString() + ' from ' + commitURL;
}

function bundle(file, name) {
  var customOpts = {
    entries: [file],
    debug: true
  };
  var opts = _.assign({}, watchify.args, customOpts);

  var b = !global.watch ? browserify(opts) : watchify(browserify(opts))
    .on('update', function () {
      bundle(file, name);
    });

  b
    .transform(require('ngify'), {
      moduleTemplate: ';',
      htmlTemplate: 'module.exports = __dirname + \'/\' + \'{htmlName}\'; angular.module(require(\'.\').name).run([\'$templateCache\', function($templateCache){$templateCache.put(module.exports,\'{html}\')}]); var ignore = { module: {} }; ignore.',
      jsTemplates: {
        provider:   'module.exports.$inject = [ {inject} ];',
        factory:    'module.exports.$inject = [ {inject} ];',
        service:    'module.exports.$inject = [ {inject} ];',
        animation:  'module.exports.$inject = [ {inject} ];',
        filter:     'module.exports.$inject = [ {inject} ];',
        controller: 'module.exports.$inject = [ {inject} ];',
        directive:  'module.exports.$inject = [ {inject} ];',

        value:    '',
        constant: '',

        config: 'module.exports.$inject = [ {inject} ];',
        run:    'module.exports.$inject = [ {inject} ];'
      }
    })
    .transform(babelify.configure({
      // Make sure to change in test_compiler.js too
      // optional: ['es7.classProperties']
    }))
    .on('log', gutil.log)
    ;

  return b.bundle()
    .on('error', function (error) {
      gutil.log(
        gutil.colors.cyan('Browserify') + gutil.colors.red(' found unhandled error:\n'),
        error.toString()
      );
      this.emit('end');
    })
    .pipe(source(name))
    .pipe(buffer())
    .pipe(header('/* ' + buildHeader() + ' */'))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('js/'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(size({
      showFiles: true,
      gzip: true
    }));
}


gulp.task('gulphint', function () {
  return gulp.src('gulpfile.js')
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    ;
});

gulp.task('lint', function () {
  return gulp.src(settings.js, { cwd: settings.dev })
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    ;
});

gulp.task('setWatch', function () {
  global.watch = true;
});

gulp.task('browserify', function () {
  var tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks);
});

gulp.task('font', function () {
  return fontelloUpdate({
    config: 'fontello.json',
    fonts: 'font',
    css: 'font'
  });
});

gulp.task('styles', function () {
  return gulp.src(settings.styles.src, { base: settings.dev })
    .pipe(plumber())
    .pipe(csscomb())
    .pipe(gulp.dest(settings.dev))
    .pipe(less({ paths: [path.join(settings.dev, settings.styles.includes)] }))
    .pipe(concat('style.css'))
    .pipe(prefix())
    .pipe(gulp.dest(path.join(settings.dev, settings.styles.dest)))
    ;
});

gulp.task('serve', ['build'], function () {
  server = gulp.src('.')
    .pipe(webserver({
      host: '0.0.0.0',
      port: 3000
    }));

  return server;
});

gulp.task('test', ['build', 'serve'], function () {
  return gulp.src(argv['test-files'] || 'tests/**/test-*.js', {read: false})
    .pipe(mocha({
      reporter: 'dot'
    }))
    .on('end', function () {
      server.emit('kill');
    });
});


gulp.task('production-scripts', ['browserify'], function () {
  return gulp.src(['./js/*.js'], { base: __dirname + '/'})
    .pipe(uglify({
      mangle: false,
      compress: {
        keep_fnames: true
      }
    }))
    .pipe(gulp.dest('build'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(size({
      showFiles: true,
      gzip: true
    }));
});

gulp.task('production-libs', function () {
  return gulp.src([
    'node_modules/angular/angular.min.js',
    'node_modules/lodash/dist/lodash.min.js'
  ], { base: __dirname + '/'}).pipe(rename(function (path) {
      path.basename = path.basename.split('.')[0];
    }))
    .pipe(gulp.dest('build/'))
    ;
});

gulp.task('production-styles', ['styles'], function () {
  return gulp.src('./css/*.css')
    .pipe(gulp.dest('build/css/'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(size({
      showFiles: true,
      gzip: true
    }));
});

gulp.task('production-static', function () {
  return gulp.src([
    'index.html',
    'img/*',
    'font/*',
    'config.js',
    'favicon.ico'
  ], { base: __dirname + '/'})
    .pipe(gulp.dest('build/'))
    ;
});

gulp.task('production', [
  'production-scripts',
  'production-styles',
  'production-libs',
  'production-static'
]);

gulp.task('serve-production', ['production'], function () {
  server = gulp.src('./build')
    .pipe(webserver({
      host: '0.0.0.0',
      port: 3000
    }));

  return server;
});

gulp.task('test-production', ['production', 'serve-production'], function () {
  return gulp.src(argv['test-files'] || 'tests/**/test-*.js', {read: false})
    .pipe(mocha({
      reporter: 'dot'
    }))
    .on('end', function () {
      server.emit('kill');
    });
});


gulp.task('watch', ['setWatch', 'browserify'], function () {
  gulp.watch(settings.js, ['lint']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});

gulp.task('build', ['gulphint', 'lint', 'styles', 'browserify']);
gulp.task('default', ['build', 'watch', 'serve']);
