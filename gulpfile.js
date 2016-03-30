/* jshint node: true */
'use strict';

var _ = require('lodash')
  , gulp = require('gulp')
  , loadPlugins = require('gulp-load-plugins')
  , path = require('path')
  , es = require('event-stream')
  , fontelloUpdate = require('fontello-update')
  , git = require('git-rev-sync')
  , pkg = require('./package.json')
  , yargs = require('yargs')
  , browserify = require('browserify')
  , watchify = require('watchify')
  , babelify = require('babelify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  ;

var express = require('express')
  , server
  , argv = yargs.argv
  , app = express()
  , plugins = loadPlugins()
  ;

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

  var b = !global.watch ? browserify(opts) : watchify(browserify(opts), { poll: 100 })
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
    .on('log', plugins.util.log)
    ;

  return b.bundle()
    .on('error', function (error) {
      plugins.util.log(
        plugins.util.colors.cyan('Browserify') + plugins.util.colors.red(' found unhandled error:\n'),
        error.toString()
      );
      this.emit('end');
    })
    .pipe(source(name))
    .pipe(buffer())
    .pipe(plugins.header('/* ' + buildHeader() + ' */'))
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('js/'))
    .pipe(plugins.size({
      showFiles: true
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true
    }));
}


gulp.task('gulphint', function () {
  return gulp.src('gulpfile.js')
    .pipe(plugins.plumber())
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    ;
});

gulp.task('lint', function () {
  return gulp.src(settings.js, { cwd: settings.dev })
    .pipe(plugins.plumber())
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    ;
});

gulp.task('browserify', function () {
  var tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks);
});

gulp.task('watchify', function () {
  global.watch = true;

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
    .pipe(plugins.plumber())
    .pipe(plugins.csscomb())
    .pipe(gulp.dest(settings.dev))
    .pipe(plugins.less({ paths: [path.join(settings.dev, settings.styles.includes)] }))
    .pipe(plugins.concat('style.css'))
    .pipe(plugins.autoprefixer())
    .pipe(gulp.dest(path.join(settings.dev, settings.styles.dest)))
    ;
});

gulp.task('serve', function () {
  server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000
    }));

  return server;
});

gulp.task('test', ['build', 'serve'], function () {
  return gulp.src(argv['test-files'] || 'tests/**/test-*.js', {read: false})
    .pipe(plugins.mocha({
      reporter: 'dot'
    }))
    .on('end', function () {
      server.emit('kill');
    });
});


gulp.task('production-scripts', ['browserify'], function () {
  return gulp.src(['./js/*.js'], { base: __dirname + '/'})
    .pipe(plugins.uglify({
      mangle: false,
      compress: {
        keep_fnames: true
      }
    }))
    .pipe(gulp.dest('build'))
    .pipe(plugins.size({
      showFiles: true
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true
    }));
});

gulp.task('production-libs', function () {
  return gulp.src([
    'node_modules/angular/angular.min.js',
    'node_modules/lodash/dist/lodash.min.js'
  ], { base: __dirname + '/'}).pipe(plugins.rename(function (path) {
      path.basename = path.basename.split('.')[0];
    }))
    .pipe(gulp.dest('build/'))
    ;
});

gulp.task('production-styles', ['styles'], function () {
  return gulp.src('./css/*.css')
    .pipe(gulp.dest('build/css/'))
    .pipe(plugins.size({
      showFiles: true
    }))
    .pipe(plugins.size({
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
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000
    }));

  return server;
});

gulp.task('test-production', ['production', 'serve-production'], function () {
  return gulp.src(argv['test-files'] || 'tests/**/test-*.js', {read: false})
    .pipe(plugins.mocha({
      reporter: 'dot'
    }))
    .on('end', function () {
      server.emit('kill');
    });
});


gulp.task('watch', ['watchify'], function () {
  gulp.watch(settings.js, ['lint']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});

gulp.task('build', ['gulphint', 'lint', 'styles', 'browserify']);
gulp.task('default', ['gulphint', 'lint', 'styles', 'watch', 'serve']);
