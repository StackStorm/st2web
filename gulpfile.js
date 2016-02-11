/* jshint node: true */
'use strict';

var gulp = require('gulp')
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
  , htmlreplace = require('gulp-html-replace')
  , glob = require('glob')
  , csscomb = require('gulp-csscomb')
  , templateCache = require('gulp-angular-templatecache')
  , ngAnnotate = require('gulp-ng-annotate')
  , uglify = require('gulp-uglify')
  , size = require('gulp-size')
  , header = require('gulp-header')
  , git = require('git-rev-sync')
  , pkg = require('./package.json')
  , yargs = require('yargs')
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

// Gather a list of all components installed.
// We are only interested in JS files since we intend to import all the css files manually through
// less import.
var components = [
  'node_modules/angular/angular.js',
  'node_modules/angular-ui-notification/dist/angular-ui-notification.min.js',
  'node_modules/angular-moment/angular-moment.js',
  'node_modules/angular-sanitize/angular-sanitize.js',
  'node_modules/angular-ui-router/release/angular-ui-router.js',
  'node_modules/angular-busy/dist/angular-busy.js',
  'node_modules/lodash/dist/lodash.js',
  'node_modules/urijs/src/URI.js',
  'node_modules/prismjs/prism.js',
  'node_modules/prismjs/components/prism-bash.js',
  'node_modules/prismjs/components/prism-yaml.js',
  'node_modules/prismjs/components/prism-powershell.js',
  'node_modules/prismjs/components/prism-python.js',
  'node_modules/prismjs/components/prism-json.js',
  'node_modules/moment/moment.js'
];

// Gathering a list of all the modules we have.
var modules = settings.js.map(function (pattern) {
  return glob.sync(pattern);
}).reduce(function(a, b) {
  return a.concat(b);
});

modules.push('node_modules/st2client/dist/st2client.js');
modules.push('node_modules/yamljs/dist/yaml.js');


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

gulp.task('html', ['scripts'], function () {
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


gulp.task('production-template', function () {
  return gulp.src(['./apps/**/*.html', './modules/**/*.html'], { base: __dirname + '/'})
    .pipe(templateCache({
      module: 'main'
    }))
    .pipe(gulp.dest('build/js'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(size({
      showFiles: true,
      gzip: true
    }));
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

gulp.task('production-components', function () {
  return gulp.src(components)
    .pipe(concat('components.js'))
    .pipe(uglify())
    .pipe(gulp.dest('build/js'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(size({
      showFiles: true,
      gzip: true
    }));
});

gulp.task('production-modules', function () {
  return gulp.src(modules)
    .pipe(ngAnnotate())
    .pipe(concat('modules.js'))
    .pipe(header('// ' + buildHeader() + '\n'))
    .pipe(gulp.dest('build/js'))
    .pipe(size({
      showFiles: true
    }))
    .pipe(size({
      showFiles: true,
      gzip: true
    }));
});

gulp.task('production-html', function () {
  return gulp.src('index.html')
    .pipe(htmlreplace({
      components: 'js/components.js',
      modules: 'js/modules.js',
      templates: 'js/templates.js'
    }))
    .pipe(gulp.dest('build/'))
    ;
});

gulp.task('production-static', function () {
  return gulp.src(['img/*', 'font/*', 'config.js', 'favicon.ico'], { base: __dirname + '/'})
    .pipe(gulp.dest('build/'))
    ;
});

gulp.task('production', [
  'production-template',
  'production-styles',
  'production-components',
  'production-modules',
  'production-html',
  'production-static'
]);


gulp.task('watch', function () {
  gulp.watch(settings.js, ['scripts', 'html']);
  gulp.watch(settings.styles.src.concat(settings.styles.includes), ['styles']);
});

gulp.task('build', ['gulphint', 'scripts', 'styles', 'html']);
gulp.task('default', ['build', 'watch', 'serve']);
