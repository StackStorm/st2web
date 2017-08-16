/* jshint node:true */
'use strict';
var URI = require('urijs');
var zombie = require('zombie');

var ST2client = require('st2client');

var client;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

class TestMarker {
  constructor(name) {
    this.names = [name];
  }

  in(name) {
    this.names.unshift(name);
    return this;
  }

  toString() {
    return this.names.map(name => `[data-test~="${name}"]`).join(' ');
  }
}

module.exports = function (browser) {
  browser.waitDuration = '10s';

  browser.on('opened', function (win) {
    win.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
  });

  browser.pipeline.addHandler(function(b, request) {
    var url = new URI(request.url);

    if (url.directory().match(/^\/auth/) || url.directory().match(/^\/api/)) {
      request.url = url.host(process.env.ST2_HOST).toString();
    }

    return null;
  });

  browser.pipeline.addHandler(function(b, request, response) {
    var url = new URI(response.url);

    if (url.path() === '/config.js') {
      return new zombie.Response('angular.module(\'main\').constant(\'st2Config\', {})');
    }

    if (url.path().indexOf('/reamaze.js') >= 0) {
      return new zombie.Response('');
    }

    if (url.host() === process.env.ST2_HOST) {
      response._url = url.host('example.com').toString();
      request.url = response.url;
    }

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
      return new Date(date).toUTCString().replace(' GMT', '');
    },
    name: function (name) {
      return new TestMarker(name);
    },
    client: function () {
      if (!client) {
        const cli = new ST2client({
          protocol: 'https',
          host: process.env.ST2_HOST.split(':')[0],
          port: process.env.ST2_HOST.split(':')[1],
          prefix: '/api',
          auth: {
            protocol: 'https',
            host: process.env.ST2_HOST.split(':')[0],
            port: process.env.ST2_HOST.split(':')[1] || 443,
            prefix: '/auth'
          }
        });

        client = cli.authenticate(process.env.ST2_USERNAME, process.env.ST2_PASSWORD)
          .then(function () {
            // No need to wait for token to expire since we're not going to use the client for long
            cli.close();
          })
          .then(function () {
            return cli;
          });
      }

      return client;
    }
  };
};
