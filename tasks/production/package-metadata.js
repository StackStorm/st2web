'use strict';

const gulp = require('gulp');
const settings = require('../settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

gulp.task('production-package-metadata', (done) => {
  var result, git_sha, data, file_path, pkg_version;

  result = child_process.spawnSync('git', ['rev-parse', '--short', 'HEAD']);
  git_sha = result.stdout.toString().trim();

  pkg_version = require(path.resolve('./package.json')).st2_version;

  data = '[st2web]\n'
  data += 'version = ' + pkg_version + '\n';
  data += 'git_sha = ' + git_sha + '\n';
  data += 'circle_build_url = ' + process.env.ST2_CIRCLE_URL;

  file_path = path.join(path.resolve('./build'), 'package.meta');

  fs.writeFileSync(file_path, data);
  done();
});
