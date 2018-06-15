'use strict';

const gulp = require('gulp');
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);
const path = require('path');
const fs = require('fs');

const _ = require('lodash');
const git = require('git-rev-sync');
const pkg = require(`${process.cwd()}/package.json`);
const es = require('event-stream');
const browserify = require('browserify');
const watchify = require('watchify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const pathmodify = require('pathmodify');
const cssExtract = require('css-extract');
const chalk = require('chalk');
const fancylog = require('fancy-log');

function buildHeader() {
  const host = 'https://github.com/';
  const commitURL = `${host + pkg.repository}/commit/${git.long()}`;

  return `Built ${new Date().toISOString()} from ${commitURL}`;
}

function walk(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    return require(pkgPath);
  }
    
  const nextDir = path.dirname(dir);

  if (nextDir === dir) {
    return false;
  }

  return walk(nextDir);
}

function overridePackage(overrides) {
  return (rec) => {
    const from = rec.id;
    const to = overrides[from];

    if (!to) {
      return {};
    }

    const pkg = walk(path.dirname(rec.opts.filename));
    if (pkg && pkg.name === to) {
      return {
        id: from,
      };
    }

    return {
      id: to,
    };
  };
}

function bundle(file, name) {
  const customOpts = {
    fullPaths: true,
    entries: [ file ],
    debug: true,
  };
  const opts = _.assign({}, watchify.args, customOpts);

  const b = !global.watch ? browserify(opts) : watchify(browserify(opts), { poll: 100 })
    .on('update', () => {
      bundle(file, name)
        .pipe(plugins.size({
          showFiles: true,
        }))
        .pipe(plugins.size({
          showFiles: true,
          gzip: true,
        }))
      ;
    });

  if (pkg.override) {
    b
      .plugin(pathmodify, {
        mods: overridePackage(pkg.override),
      });
  }

  fs.mkdir(settings.styles.dest, () => { /* noop */ });

  b
    .plugin(cssExtract, { out: path.join(settings.styles.dest, 'style.css')})
    .on('log', fancylog)
  ;

  return b.bundle()
    .on('error', function (error) {
      fancylog(
        chalk.cyan('Browserify') + chalk.red(' found unhandled error:\n'),
        error.toString()
      );
      this.emit('end');
    })
    .pipe(source(name))
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.header(`/* ${buildHeader()} */`))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('js/'))
  ;
}

gulp.task('browserify', () => {
  const tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks)
    .pipe(plugins.size({
      showFiles: true,
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true,
    }))
  ;
});

gulp.task('watchify', () => {
  global.watch = true;

  const tasks = _.map(settings.modules, bundle);

  return es.merge.apply(null, tasks)
    .pipe(plugins.size({
      showFiles: true,
    }))
    .pipe(plugins.size({
      showFiles: true,
      gzip: true,
    }))
  ;
});
