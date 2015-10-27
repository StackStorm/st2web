/* jshint node:true */
'use strict';

module.exports = function (browser) {
  return {
    login: function () {
      return browser
        .fill('username', 'testu')
        .fill('password', 'testp')
        .pressButton('Connect');
    },
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    formatUTC: function (date) {
      return new Date(date).toUTCString().replace('GMT', 'UTC');
    },
    name: function (name) {
      return '[data-name="' + name + '"]';
    }
  };
};
