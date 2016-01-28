/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');
var chai = require('chai');

var expect = chai.expect;
var utilFactory = require('./util');

Browser.localhost('example.com', 3000);

describe('User visits actions page', function () {
  var browser = new Browser();
  var util = utilFactory(browser);

  this.timeout(10000);

  before(function () {
    return browser.visit('/#/actions').then(util.login);
  });

  it('should be successful', function () {
    browser.assert.success();
  });

  it('should have correct url', function () {
    browser.assert.url('http://example.com/#/actions');
  });

  describe('List view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        return new RegExp('^https://example.com/api/v1/actions$').test(e.url);
      });
    });

    it('should make a call to actions endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Actions endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Actions endpoint called several times');
    });

    it('should recieve a response containing a number of actions', function () {
      var actions = JSON.parse(resource[0].response.body);

      expect(actions).to.have.length.of.at.least(1, 'No actions to show');
    });

    it('should have all the actions present', function () {
      var executions = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('action'), executions.length, 'Wrong number of actions');
    });
  });

  describe('Details view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        return new RegExp('^https://example.com/api/v1/actions/views/overview/[\\w.-]+$').test(e.url);
      });
    });

    it('should make a call to actions endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Execution endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Execution endpoint called several times');
    });

    it('should recieve a response containing an action', function () {
      var execution = JSON.parse(resource[0].response.body);

      expect(execution).to.be.an('object');
    });

    it('should have action details present', function () {
      var action = JSON.parse(resource[0].response.body);

      browser.assert.element(util.name('details'), 'Details panel is absent');

      // browser.assert.element(util.name('flow_link'), 'Flow link is missing');

      browser.assert.text(util.name('header_name'), action.ref, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), action.description, 'Wrong description in header');

      browser.assert.element(util.name('action_parameters'), 'Action parameters are missing');

      try {
        browser.assert.element(util.name('action_code'));
      } catch (e) {
        browser.assert.element(util.name('no_code_message'), 'Action code and a message are both missing');
      }

      try {
        browser.assert.element(util.name('action_executions'));
      } catch (e) {
        browser.assert.element(util.name('no_executions_message'), 'Action executions and an error message are both missing');
      }
    });
  });

  after(function () {
    browser.tabs.closeAll();
  });
});
