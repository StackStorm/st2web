'use strict';

var gulp = require('gulp')
  , settings = require('../settings.json')
  , plugins = require('gulp-load-plugins')(settings.plugins)

  , _ = require('lodash')
  , git = require('git-rev-sync')
  , pkg = require('../package.json')
  , es = require('event-stream')
  , browserify = require('browserify')
  , watchify = require('watchify')
  , babelify = require('babelify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  ;

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
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.header('/* ' + buildHeader() + ' */'))
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

gulp.task('browserify', function () {
  var tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks);
});

gulp.task('watchify', function () {
  global.watch = true;

  var tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks);
});
