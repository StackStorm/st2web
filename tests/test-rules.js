/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');
var chai = require('chai');

var expect = chai.expect;
var utilFactory = require('./util');

Browser.localhost('example.com', 3000);

describe('User visits rules page', function () {
  var browser = new Browser();
  var util = utilFactory(browser);

  this.timeout(10000);

  before(function () {
    return browser.visit('/#/rules').then(util.login);
  });

  it('should be successful', function () {
    browser.assert.success();
  });

  it('should have correct url', function () {
    browser.assert.url('http://example.com/#/rules');
  });

  describe('List view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        return new RegExp('^http://172.168.60.10:9101/v1/rules/views$').test(e.url);
      });
    });

    it('should make a call to rules endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
    });

    it('should recieve a response containing a number of rules', function () {
      var executions = JSON.parse(resource[0].response.body);

      expect(executions).to.have.length.of.at.least(1, 'No rules to show');
    });

    it('should have all the rules present', function () {
      var executions = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('rule'), executions.length, 'Wrong number of rules');
    });
  });

  describe('Details view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        var match = e.url.match(new RegExp('^http://172.168.60.10:9101/v1/rules/([\\w.-]+)$'));
        return match && match[1] && match[1] !== 'views';
      });
    });

    it('should make a call to rule endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Rule endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Rule endpoint called several times');
    });

    it('should recieve a response containing a rule', function () {
      var rule = JSON.parse(resource[0].response.body);

      expect(rule).to.be.an('object');
    });

    it('should have execution details present', function () {
      var rule = JSON.parse(resource[0].response.body);

      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.element(util.name('edit_button'), 'Edit button is missing');
      browser.assert.element(util.name('delete_button'), 'Delete button is missing');

      browser.assert.text(util.name('status'), rule.enabled ? 'Enabled' : 'Disabled', 'Wrong status');
      browser.assert.text(util.name('header_name'), rule.name, 'Wrong name in header');
      browser.assert.text(util.name('header_description'), rule.description, 'Wrong description in header');
      browser.assert.text(util.name('header_if'), 'If ' + rule.trigger.ref, 'Wrong if in header');
      browser.assert.text(util.name('header_then'), 'Then ' + rule.action.ref, 'Wrong then in header');

      browser.assert.element(util.name('rule_trigger_form'), 'Rule trigger form is missing');
      browser.assert.element(util.name('rule_criteria_form'), 'Rule trigger form is missing');
      browser.assert.element(util.name('rule_action_form'), 'Rule action form is missing');

      browser.assert.element(util.name('rule_code'), 'Rule code is missing');
    });
  });

  after(function () {
    browser.tabs.closeAll();
  });
});
