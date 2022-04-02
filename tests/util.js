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

/* jshint node:true */
'use strict';
const URI = require('urijs');
const moment = require('moment');
const zombie = require('zombie');

require('@stackstorm/module-test-utils/bootstrap/st2constants');
const { API } = require('@stackstorm/module-api');

let client;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p); // eslint-disable-line no-console
});

class TestMarker {
  constructor(name) {
    this.names = [ name ];
  }

  in(name) {
    this.names.unshift(name);
    return this;
  }

  toString() {
    return this.names.map((name) => `[data-test~="${name}"]`).join(' ');
  }
}

module.exports = function (browser) {
  browser.waitDuration = '10s';

  browser.on('opened', (win) => {
    win.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
    win.document.raise = (e) => console.error(e);
  });

  browser.pipeline.addHandler((b, request, response) => {
    const url = new URI(response.url);

    if (url.path() === '/config.js') {
      return new zombie.Response(`angular.module('main').constant('st2Config', {
        hosts: [{
          name: 'Test',
          url: '${process.env.ST2_PROTOCOL}://${process.env.ST2_HOST}/api',
          auth: '${process.env.ST2_PROTOCOL}://${process.env.ST2_HOST}/auth',
        }],
        });`);
    }

    if (url.path().indexOf('/reamaze.js') >= 0) {
      return new zombie.Response('');
    }

    if (url.host() === process.env.ST2_HOST) {
      // All the tests expect https:// so we just hack that and replace http with https in case
      // https is not used
      response._url = url.host('example.com').toString().replace("http://", "https://");
      request.url = response.url;
    }

    response.headers.set('access-control-allow-origin', '*');

    return response;
  });

  return {
    login: function () {
      return browser
        .fill('username', process.env.ST2_USERNAME)
        .fill('password', process.env.ST2_PASSWORD)
        .pressButton('Connect');
    },
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    formatUTC: function (date) {
      return moment(date).utc().format('ddd, DD MMM YYYY HH:mm:ss');
    },
    formatLocal: function (date) {
      return moment(date).format('ddd, DD MMM YYYY HH:mm:ss');
    },
    name: function (name) {
      return new TestMarker(name);
    },
    client: function () {
      if (!client) {
        const api = new API();

        client = api.connect({
          url: `${process.env.ST2_PROTOCOL}://${process.env.ST2_HOST}/api`,
          auth: `${process.env.ST2_PROTOCOL}://${process.env.ST2_HOST}/auth`,
        }, process.env.ST2_USERNAME, process.env.ST2_PASSWORD)
          .then(() => api);
        }

      return client;
    },
  };
};
