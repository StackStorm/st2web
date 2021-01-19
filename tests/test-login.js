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
    before(function () {
      this.timeout(20000);
      return util.login();
    });

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
