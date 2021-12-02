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

/* global angular */
angular.module('main')
  .constant('st2Config', {

    // In case you want to override default value for the result sizes we still render in the
    // history details widget. Keep in mind that anything above 200-500 KB will take a long time to
    // render and likely freeze the browser window for deeply nested JSON object results.
    // Value is in bytes.
    // max_execution_result_size_for_render: 200 * 1024,
    // set application inactivity time default for 2 hr, here it is in seconds.
    // application_inactivity_time : 7200,
    // Set to true to display StackStorm and st2web version in the header
    //show_version_in_header: false;

    // hosts: [
    //   {
    //     name: 'Dev Env',
    //     url: 'https://:443/api',
    //     auth: 'https://:443/auth',
    //     stream: 'https://:443/stream',
    //   },
    //   {
    //     name: 'Express',
    //     url: '//172.168.90.50:9101/api',
    //     auth: '//172.168.90.50:9101/auth',
    //   },
    // ],

  });
