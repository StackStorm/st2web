// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
