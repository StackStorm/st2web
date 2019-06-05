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
const settings = require('../settings.json');
const plugins = require('gulp-load-plugins')(settings.plugins);

const argv = require('yargs').argv;

gulp.task('test-production', gulp.series([ 'production' ], (done) => {
  const server = gulp.src('.')
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3002,
    }));

  plugins.env({
    vars: {
      PORT: 3002,
    },
  });

  return gulp.src(argv['test-files'] || settings.production.tests, { read: false })
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: 'dot',
      require: [
        '@babel/register',
      ],
    }))
    .on('end', () => {
      server.emit('kill');
      return done();
    })
    .on('error', (err) => done(err));
}));
