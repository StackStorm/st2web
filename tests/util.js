/* jshint node:true */
'use strict';
const URI = require('urijs');
const moment = require('moment');
const zombie = require('zombie');

const ST2client = require('@stackstorm/module-api/node_modules/st2client');

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
          url: 'https://${process.env.ST2_HOST}/api',
          auth: 'https://${process.env.ST2_HOST}/auth',
        }],
      });`);
    }

    if (url.path().indexOf('/reamaze.js') >= 0) {
      return new zombie.Response('');
    }

    if (url.host() === process.env.ST2_HOST) {
      response._url = url.host('example.com').toString();
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
        const cli = new ST2client({
          protocol: 'https',
          host: process.env.ST2_HOST.split(':')[0],
          port: process.env.ST2_HOST.split(':')[1],
          prefix: '/api',
          auth: {
            protocol: 'https',
            host: process.env.ST2_HOST.split(':')[0],
            port: process.env.ST2_HOST.split(':')[1] || 443,
            prefix: '/auth',
          },
        });

        client = cli.authenticate(process.env.ST2_USERNAME, process.env.ST2_PASSWORD)
          .then(() => {
            // No need to wait for token to expire since we're not going to use the client for long
            cli.close();
          })
          .then(() => cli);
      }

      return client;
    },
  };
};
