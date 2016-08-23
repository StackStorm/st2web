/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');
var chai = require('chai');

var expect = chai.expect;
var utilFactory = require('./util');

Browser.localhost('example.com', process.env.PORT || 3000);

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
        return new RegExp('^https://example.com/api/v1/actions[?]').test(e.url);
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

    it('should highlight the first row', function () {
      var elements = browser.queryAll(util.name('action'));
      expect(elements[0].className).to.have.string('st2-flex-card--active');
    });

    it('should filter actions (case insensitive)', function () {
      return browser.fill(util.name('filter'), 'CORE.')
        .wait()
        .then(function () {
          var actions = browser.queryAll(util.name('action'));

          expect(actions).to.have.length.at.least(1, 'All the actions has been filtered out');
          for (const action of actions) {
            expect(action.getAttribute('data-test')).to.have.string('action:core.');
          }
        });
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
      var action = JSON.parse(resource[0].response.body);

      expect(action).to.be.an('object');
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

  describe('then selects an action', function () {
    before(function () {
      return browser.click(util.name('action:core.announcement'));
    });

    it('should be successful', function () {
      browser.assert.success();
    });

    it('should have correct url', function () {
      browser.assert.url('http://example.com/#/actions/core.announcement/general');
    });

    describe('List view', function () {
      it('should highlight the selected row', function () {
        var element = browser.query(util.name('action:core.announcement'));
        expect(element.className).to.have.string('st2-flex-card--active');
      });

      it('should expand the pack', function () {
        var element = browser.query(util.name('pack:core'));
        expect(element.className).to.not.have.string('st2-flex-table--collapsed');
      });
    });

    describe('Details view', function () {
      var resource;

      before(function () {
        resource = browser.resources.filter(function (e) {
          return new RegExp('^https://example.com/api/v1/actions/views/overview/core.announcement$').test(e.url);
        });
      });

      it('should make a call to actions endpoint once', function () {
        expect(resource).to.have.length.at.least(1, 'Actions endpoint has not been called');
        expect(resource).to.have.length.at.most(1, 'Actions endpoint called several times');
      });

      it('should recieve a response containing an action', function () {
        var action = JSON.parse(resource[0].response.body);

        expect(action).to.be.an('object')
          .and.have.property('ref', 'core.announcement');
      });

      it('should have action details present', function () {
        var action = JSON.parse(resource[0].response.body);

        browser.assert.element(util.name('details'), 'Details panel is absent');

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

    describe('and runs it', function () {
      var resource;

      before(function () {
        return browser
          .fill(util.name('field:route'), 'test')
          .fill(util.name('field:message'), '{ "passed": true }')
          .pressButton(util.name('run_submit'))
          .then(function () {
            resource = browser.resources.filter(function (e) {
              return e.request.method === 'POST' && new RegExp('^https://example.com/api/v1/executions$').test(e.url);
            });
          })
          ;
      });

      it('should make a call to executions endpoint once', function () {
        expect(resource).to.have.length.at.least(1, 'Executions endpoint has not been called');
        expect(resource).to.have.length.at.most(1, 'Executions endpoint called several times');
      });
    });

  });

  after(function () {
    browser.tabs.closeAll();
  });
});
