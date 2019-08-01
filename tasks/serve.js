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

let server;

gulp.task('serve', () => {
  const st2host = process.env.ST2_HOST || '127.0.0.1';
  const options = {
    rejectUnauthorized: false,
  };

  server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: process.env.PORT || 3000,
      https: true,
      proxies: [{
        source: '/api',
        target: `https://${st2host}/api`,
        options,
      }, {
        source: '/auth',
        target: `https://${st2host}/auth`,
        options,
      }, {
        source: '/stream',
        target: `https://${st2host}/stream`,
        options,
      }],
    }));

  return server;
});
