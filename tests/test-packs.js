/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');
var chai = require('chai');

var expect = chai.expect;
var utilFactory = require('./util');

Browser.localhost('example.com', process.env.PORT || 3000);

describe('User visits packs page', function () {
  var browser = new Browser();
  var util = utilFactory(browser);

  var packs_resource;
  var index_resource;
  var config_resource;
  var config_schema_resource;

  this.timeout(10000);

  before(function () {
    return browser.visit('/#/packs')
      .then(util.login)
      .then(function () {

        packs_resource = browser.resources.filter(function (e) {
          return new RegExp('^https://example.com/api/v1/packs$').test(e.url);
        });

        index_resource = browser.resources.filter(function (e) {
          return new RegExp('^https://example.com/api/v1/packs/index$').test(e.url);
        });

        config_resource = browser.resources.filter(function (e) {
          return new RegExp('^https://example.com/api/v1/configs(\\?|$)').test(e.url);
        });

        config_schema_resource = browser.resources.filter(function (e) {
          return new RegExp('^https://example.com/api/v1/config_schemas$').test(e.url);
        });

      });
  });

  it('should be successful', function () {
    browser.assert.success();
  });

  it('should have correct url', function () {
    browser.assert.url('http://example.com/#/packs');
  });

  it('should make a call each pack related endpoint once', function () {
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

  it('should recieve a response containing a number of packs', function () {
    var packs = JSON.parse(packs_resource[0].response.body);

    expect(packs).to.have.length.of.at.least(1, 'No packs to show');
  });

  it('should have all the packs present', function () {
    var packs = JSON.parse(packs_resource[0].response.body);
    var index = JSON.parse(index_resource[0].response.body);

    var installed_packs = packs.map(function (pack) { return pack.ref; });
    var index_packs = Object.keys(index.index);
    var all_packs = [].concat(installed_packs).concat(index_packs)
      .filter(function (value, index, list) {
        return list.indexOf(value) === index;
      });

    browser.assert.elements(util.name('pack'), all_packs.length, 'Wrong number of actions');
  });

  it('should highlight the first row', function () {
    var elements = browser.queryAll(util.name('pack'));
    expect(elements[0].className).to.have.string('st2-flex-card--active');
  });

  it('should filter packs (case insensitive)', function () {
    return browser.fill(util.name('filter'), 'CORE')
      .wait()
      .then(function () {
        var packs = browser.queryAll(util.name('pack'));

        expect(packs).to.have.length.at.least(1, 'All the actions has been filtered out');
        for (const pack of packs) {
          expect(pack.getAttribute('data-test')).to.have.string('pack:core');
        }
      });
  });

  it('should have pack details present', function () {
    var pack = JSON.parse(packs_resource[0].response.body)[0];

    browser.assert.element(util.name('details'), 'Details panel is absent');

    browser.assert.text(util.name('header_name'), pack.name, 'Wrong ref in header');
    browser.assert.text(util.name('header_description'), pack.description, 'Wrong description in header');

    browser.assert.element(util.name('pack_info'), 'Pack info is missing');

    browser.assert.element(util.name('pack_content'), 'Pack content is missing');

    var schema = JSON.parse(packs_resource[0].response.body).find(s => s.pack === pack.ref);
    if (schema) {
      browser.assert.element(util.name('pack_config'), 'Pack config is missing');
    }
  });

  describe('then selects a pack', function () {
    before(function () {
      return browser.click(util.name('pack:core'));
    });

    it('should be successful', function () {
      browser.assert.success();
    });

    it('should have correct url', function () {
      browser.assert.url('http://example.com/#/packs/core');
    });

    it('should highlight the selected row', function () {
      var element = browser.query(util.name('pack:core'));
      expect(element.className).to.have.string('st2-flex-card--active');
    });

    it('should recieve a response containing an action', function () {
      var pack = JSON.parse(packs_resource[0].response.body).find(p => p.ref === 'core');

      expect(pack).to.be.an('object')
        .and.have.property('ref', 'core');
    });

    it('should have action details present', function () {
      var pack = JSON.parse(packs_resource[0].response.body).find(p => p.ref === 'core');

      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.text(util.name('header_name'), pack.name, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), pack.description, 'Wrong description in header');

      browser.assert.element(util.name('pack_info'), 'Pack info is missing');

      browser.assert.element(util.name('pack_content'), 'Pack content is missing');

      var schema = JSON.parse(packs_resource[0].response.body).find(s => s.pack === pack.ref);
      if (schema) {
        browser.assert.element(util.name('pack_config'), 'Pack config is missing');
      }
    });

  });

  after(function () {
    browser.tabs.closeAll();
  });
});
