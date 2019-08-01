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
const chai = require('chai');

const expect = chai.expect;
const utilFactory = require('./util');

Browser.localhost('example.com', process.env.PORT || 3000);

describe('User visits packs page', function () {
  const browser = new Browser();
  const util = utilFactory(browser);

  let packs_resource;
  let index_resource;
  let config_resource;
  let config_schema_resource;

  this.timeout(10000);

  before(() => browser.visit('/#/packs')
    .then(util.login)
    .then(() => {
      packs_resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/packs$').test(e.url));
      index_resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/packs/index$').test(e.url));
      config_resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/configs(\\?|$)').test(e.url));
      config_schema_resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/config_schemas$').test(e.url));
    }));

  it('should be successful', () => {
    browser.assert.success();
  });

  it('should have correct url', () => {
    browser.assert.url('http://example.com/#/packs');
  });

  it('should make a call each pack related endpoint once', () => {
    expect(packs_resource).to.have.length.at.least(1, 'Packs endpoint has not been called');
    expect(packs_resource).to.have.length.at.most(1, 'Packs endpoint called several times');

    expect(index_resource).to.have.length.at.least(1, 'Index endpoint has not been called');
    expect(index_resource).to.have.length.at.most(1, 'Index endpoint called several times');

    expect(config_resource).to.have.length.at.least(1, 'Config endpoint has not been called');
    expect(config_resource).to.have.length.at.most(1, 'Config endpoint called several times');

    expect(config_schema_resource).to.have.length
      .at.least(1, 'Config schema endpoint has not been called');
    expect(config_schema_resource).to.have.length
      .at.most(1, 'Config schema endpoint called several times');
  });

  it('should recieve a response containing a number of packs', () => {
    const packs = JSON.parse(packs_resource[0].response.body);

    expect(packs).to.have.length.of.at.least(1, 'No packs to show');
  });

  it('should have all the packs present', () => {
    const packs = JSON.parse(packs_resource[0].response.body);
    const index = JSON.parse(index_resource[0].response.body);

    const installed_packs = packs.map((pack) => pack.ref);
    const index_packs = Object.keys(index.index);
    const all_packs = [].concat(installed_packs).concat(index_packs)
      .filter((value, index, list) => list.indexOf(value) === index);

    browser.assert.elements(util.name('pack'), all_packs.length, 'Wrong number of actions');
  });

  it('should highlight the first row', () => {
    const elements = browser.queryAll(util.name('pack'));
    expect(elements[0].className).to.have.string('st2-flex-card--active');
  });

  it('should filter packs (case insensitive)', () => {
    return browser.fill(util.name('filter'), 'CORE').wait()
      .then(() => {
        const packs = browser.queryAll(util.name('pack'));

        expect(packs).to.have.length.at.least(1, 'All the actions has been filtered out');
        for (const pack of packs) {
          expect(pack.getAttribute('data-test')).to.have.string('pack:core');
        }
      })
      .then(() => browser.fill(util.name('filter'), '').wait())
    ;
  });

  it('should have pack details present', () => {
    const pack = JSON.parse(packs_resource[0].response.body)[0];

    browser.assert.element(util.name('details'), 'Details panel is absent');

    browser.assert.text(util.name('header_name'), pack.name, 'Wrong ref in header');
    browser.assert.text(util.name('header_description'), pack.description, 'Wrong description in header');

    browser.assert.element(util.name('pack_info'), 'Pack info is missing');

    browser.assert.element(util.name('pack_content'), 'Pack content is missing');

    const schema = JSON.parse(packs_resource[0].response.body).find((s) => s.pack === pack.ref);
    if (schema) {
      browser.assert.element(util.name('pack_config'), 'Pack config is missing');
    }
  });

  describe('then selects a pack', () => {
    before(() => browser.click(util.name('pack:core')));

    it('should be successful', () => {
      browser.assert.success();
    });

    it('should have correct url', () => {
      browser.assert.url('http://example.com/#/packs/core');
    });

    it('should highlight the selected row', () => {
      const element = browser.query(util.name('pack:core'));
      expect(element.className).to.have.string('st2-flex-card--active');
    });

    it('should recieve a response containing an action', () => {
      const pack = JSON.parse(packs_resource[0].response.body).find((p) => p.ref === 'core');

      expect(pack).to.be.an('object')
        .and.have.property('ref', 'core');
    });

    it('should have action details present', () => {
      const pack = JSON.parse(packs_resource[0].response.body).find((p) => p.ref === 'core');

      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.text(util.name('header_name'), pack.name, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), pack.description, 'Wrong description in header');

      browser.assert.element(util.name('pack_info'), 'Pack info is missing');

      browser.assert.element(util.name('pack_content'), 'Pack content is missing');

      const schema = JSON.parse(packs_resource[0].response.body).find((s) => s.pack === pack.ref);
      if (schema) {
        browser.assert.element(util.name('pack_config'), 'Pack config is missing');
      }
    });

  });

  after(() => {
    browser.tabs.closeAll();
  });
});
