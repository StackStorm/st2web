/* jshint node:true, mocha:true */
'use strict';
const Browser = require('zombie');

const utilFactory = require('./util');

Browser.localhost('example.com', process.env.PORT || 3000);

describe('User visits login', () => {
  const browser = new Browser();
  const util = utilFactory(browser);

  before(function () {
    this.timeout(10000);

    return browser.visit('/#/');
  });

  it('should be successful', () => {
    browser.assert.success();
  });

  it('should have correct url', () => {
    browser.assert.url('http://example.com/#/history');
  });

  it('should have login form present', () => {
    browser.assert.element(util.name('login'), 'Login form is missing');
  });

  describe('Submit', () => {
    before(() => util.login());

    it('should be successful', () => {
      browser.assert.success();
    });

    it('should have correct url', () => {
      browser.assert.url('http://example.com/#/history');
    });

    it('should have history panel present', () => {
      browser.assert.element(util.name('history_panel'), 'History panel is missing');
    });
  });

  after(() => {
    browser.tabs.closeAll();
  });
});
