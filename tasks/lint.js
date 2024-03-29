// Copyright 2021 The StackStorm Authors.
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
const settings = require('./settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

gulp.task('lint', (done) => gulp.src(settings.lint, { cwd: settings.dev })
  .pipe(plugins.plumber())
  .pipe(plugins.eslint({ fix: true }))
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failAfterError())
  .on('end', () => done())
  .on('error', (err) => done(err))
);
