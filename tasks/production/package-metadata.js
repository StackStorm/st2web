'use strict';

const gulp = require('gulp');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

gulp.task('production-package-metadata', (done) => {
  const circle_build_url = process.env.CIRCLE_BUILD_URL;

  const result = child_process.spawnSync('git', [ 'rev-parse', '--short', 'HEAD' ]);
  const git_sha = result.stdout.toString().trim();

  const pkg_version = require(path.resolve('./package.json')).st2_version;

  const data = `[st2web]\nversion = ${pkg_version}\ngit_sha = ${git_sha}\ncircle_build_url = ${circle_build_url}\n`;

  const file_path = path.join(path.resolve('./build'), 'package.meta');

  fs.writeFileSync(file_path, data);
  done();
});
