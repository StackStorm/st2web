/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');
var chai = require('chai');

var expect = chai.expect;
var utilFactory = require('./util');

Browser.localhost('example.com', process.env.PORT || 3000);

describe('User visits history page', function () {
  var browser = new Browser();
  var util = utilFactory(browser);

  this.timeout(10000);

  before(function () {
    return browser.visit('/#/history').then(util.login);
  });

  it('should be successful', function () {
    browser.assert.success();
  });

  it('should have correct url', function () {
    browser.assert.url('http://example.com/#/history');
  });

  describe('List view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        return ~e.url.indexOf('https://example.com/api/v1/executions?'); // eslint-disable-line no-bitwise
      });
    });

    it('should make a call to executions endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Executions endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Executions endpoint called several times');
    });

    it('should recieve a response containing a number of executions', function () {
      var executions = JSON.parse(resource[0].response.body);

      expect(executions).to.have.length.of.at.least(1, 'No executions to show');
      expect(executions).to.have.length.of.at.most(50, 'Too many executions');
    });

    it('should have all the records present', function () {
      var executions = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('record'), executions.length, 'Wrong number of records');
    });
  });

  describe('Details view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        return new RegExp('^https://example.com/api/v1/executions/\\w+$').test(e.url);
      });
    });

    it('should make a call to execution endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Execution endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Execution endpoint called several times');
    });

    it('should recieve a response containing an execution', function () {
      var execution = JSON.parse(resource[0].response.body);

      expect(execution).to.be.an('object');
    });

    it('should have execution details present', function () {
      var execution = JSON.parse(resource[0].response.body);

      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.element(util.name('rerun_button'), 'Rerun button is missing');

      browser.assert.text(util.name('header_name'), execution.action.ref, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), execution.action.description, 'Wrong description in header');

      browser.assert.text(util.name('status'), util.capitalize(execution.status), 'Wrong status');
      browser.assert.text(util.name('execution_id'), execution.id, 'Wrong execution id');
      browser.assert.text(util.name('start_timestamp'), util.formatUTC(execution.start_timestamp), 'Wrong start time');
      browser.assert.text(util.name('end_timestamp'), util.formatUTC(execution.end_timestamp), 'Wrong end time');

      var execution_time = Math.ceil((new Date(execution.end_timestamp).getTime() - new Date(execution.start_timestamp).getTime()) / 1000);
      browser.assert.text(util.name('execution_time'), execution_time + ' s', 'Wrong execution time');

      browser.assert.element(util.name('action_output'), 'Action output is missing');
      browser.assert.element(util.name('action_input'), 'Action input is missing');
      browser.assert.element(util.name('record_code'), 'Record code is missing');
    });
  });

  describe('Rerun', function () {
    it('should be closed initially', function () {
      browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
    });

    it('should open on button click', function () {
      browser.pressButton(util.name('rerun_button'))
        .then(function () {
          browser.assert.element(util.name('rerun_popup'), 'Rerun is not in DOM');
        });
    });

    it('should show a form', function () {
      return browser.pressButton(util.name('rerun_button'))
        .then(function () {
          browser.assert.element(util.name('rerun_form_action'), 'Action input is missing');
          browser.assert.element(util.name('rerun_submit'), 'Submit button is missing');
          browser.assert.element(util.name('rerun_cancel'), 'Cancel button is missing');
        });
    });

    it('should rerun the action on submit button', function () {
      return browser.pressButton(util.name('rerun_submit'))
        .then(function () {
          var resource = browser.resources.filter(function (e) {
            return e.request.method === 'POST' && new RegExp('^https://example.com/api/v1/executions/\\w+/re_run$').test(e.url);
          });

          expect(resource).to.have.length(1, 'Rerun should make a single request');

          browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');

          // TODO: check stream event
        });
    });

    it('should close the popup on cancel button', function () {
      return browser.pressButton(util.name('rerun_button'))
        .then(function () {
          browser.assert.element(util.name('rerun_popup'), 'Rerun is not in DOM');
        })
        .then(function () {
          return browser.pressButton(util.name('rerun_cancel'));
        })
        .then(function () {
          browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
        });
    });

    it('should close the popup on clicking outside the view', function () {
      return browser.pressButton(util.name('rerun_button'))
        .then(function () {
          browser.assert.element(util.name('rerun_popup'), 'Rerun is not in DOM');
        })
        .then(function () {
          browser.click(util.name('rerun_popup'));
        })
        .then(function () {
          browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
        });
    });
  });

  after(function () {
    browser.tabs.closeAll();
  });
});
