/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');

var utilFactory = require('./util');

Browser.localhost('example.com', 3000);

describe('User visits login', function () {
  var browser = new Browser();
  var util = utilFactory(browser);

  before(function () {
    this.timeout(5000);

    return browser.visit('/');
  });

  it('should be successful', function () {
    browser.assert.success();
  });

  it('should have correct url', function () {
    browser.assert.url('http://example.com/');
  });

  describe('Submit', function () {
    before(function () {
      return util.login();
    });

    it('should be successful', function () {
      browser.assert.success();
    });

    it('should have correct url', function () {
      browser.assert.url('http://example.com/#/history');
    });
  });

  after(function () {
    browser.tabs.closeAll();
  });
});
