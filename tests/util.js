/* jshint node:true */
'use strict';
var URI = require('urijs');
var zombie = require('zombie');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = function (browser) {
  browser.on('opened', function (win) {
    win.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
  });

  browser.pipeline.addHandler(function(browser, request) {
    var url = new URI(request.url);

    if (url.directory().match(/^\/auth/) || url.directory().match(/^\/api/)) {
      request.url = url.host(process.env.ST2_HOST).toString();
    }

    return null;
  });

  browser.pipeline.addHandler(function(browser, request, response) {
    var url = new URI(response.url);

    if (url.path() === '/config.js') {
      return new zombie.Response('angular.module(\'main\').constant(\'st2Config\', {})');
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
      return new Date(date).toUTCString().replace('GMT', 'UTC');
    },
    name: function (name) {
      return '[data-test="' + name + '"]';
    }
  };
};
