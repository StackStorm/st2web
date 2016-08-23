/* jshint node:true, mocha:true */
'use strict';
var Browser = require('zombie');
var chai = require('chai');

var expect = chai.expect;
var utilFactory = require('./util');

Browser.localhost('example.com', process.env.PORT || 3000);

describe('User visits rules page', function () {
  var browser = new Browser();
  var util = utilFactory(browser);

  this.timeout(10000);

  var uniqueId = '_' + Math.random().toString(36).substr(2, 9);

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
        return new RegExp('^https://example.com/api/v1/rules/views$').test(e.url);
      });
    });

    it('should make a call to rules endpoint once', function () {
      expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
    });

    it('should recieve a response containing a number of rules', function () {
      var rules = JSON.parse(resource[0].response.body);

      expect(rules).to.have.length.of.at.least(1, 'No rules to show');
    });

    it('should have all the rules present', function () {
      var rules = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('rule'), rules.length, 'Wrong number of rules');
    });

    it('should highlight the first row', function () {
      var elements = browser.queryAll(util.name('rule'));
      expect(elements[0].className).to.have.string('st2-flex-card--active');
    });

    it('should filter rules (case insensitive)', function () {
      return browser.fill(util.name('filter'), 'cHatoPs.')
        .wait()
        .then(function () {
          var rules = browser.queryAll(util.name('rule'));

          expect(rules).to.have.length.at.least(1, 'All the rules has been filtered out');
          for (const rule of rules) {
            expect(rule.getAttribute('data-test')).to.have.string('rule:chatops.');
          }
        });
    });
  });

  describe('Details view', function () {
    var resource;

    before(function () {
      resource = browser.resources.filter(function (e) {
        var match = e.url.match(new RegExp('^https://example.com/api/v1/rules/([\\w.-]+)$'));
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

    it('should have rule details present', function () {
      var rule = JSON.parse(resource[0].response.body);

      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.element(util.name('edit_button'), 'Edit button is missing');
      browser.assert.element(util.name('delete_button'), 'Delete button is missing');

      browser.assert.text(util.name('status'), rule.enabled ? 'Enabled' : 'Disabled', 'Wrong status');
      browser.assert.text(util.name('header_name'), rule.ref, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), rule.description, 'Wrong description in header');
      browser.assert.text(util.name('header_if'), 'If ' + rule.trigger.type, 'Wrong if in header');
      browser.assert.text(util.name('header_then'), 'Then ' + rule.action.ref, 'Wrong then in header');

      browser.assert.element(util.name('rule_trigger_form'), 'Rule trigger form is missing');
      browser.assert.element(util.name('rule_criteria_form'), 'Rule trigger form is missing');
      browser.assert.element(util.name('rule_action_form'), 'Rule action form is missing');

      browser.assert.element(util.name('rule_code'), 'Rule code is missing');
    });
  });

  describe('then opens a new rule popup', function () {
    before(function () {
      return browser.click(util.name('rule_create_button'));
    });

    it('should have correct url', function () {
      browser.assert.url('http://example.com/#/rules/new');
    });

    it('should show a popup', function () {
      browser.assert.element(util.name('rule_create_popup'), 'Rule create popup is absent');
      browser.assert.hasNoClass(util.name('rule_create_popup'), 'ng-hide', 'Rule create popup is hidden');
    });

    describe('then creates a new rule', function () {
      var resource;

      before(function () {
        return browser
          .fill(util.name('field:name').in('rule_create_popup'), 'test' + uniqueId)
          .fill(util.name('field:description').in('rule_create_popup'), 'some')
          .fill(util.name('field:pack').in('rule_create_popup'), 'packs')
          .uncheck(util.name('field:enabled').in('rule_create_popup'))
          .fill(util.name('field:name').in('rule_create_trigger_form').in('rule_create_popup'), 'core.st2.sensor.process_exit')
          .fill(util.name('field:name').in('rule_create_action_form').in('rule_create_popup'), 'core.announcement')
          .wait()
          .then(function () {
            return browser.pressButton(util.name('rule_create_submit'));
          })
          .then(function () {
            resource = browser.resources.filter(function (e) {
              return e.request.method === 'POST' && new RegExp('^https://example.com/api/v1/rules$').test(e.url);
            });
          })
          ;
      });

      it('should make a call to rules endpoint once', function () {
        expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
        expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
      });
    });
  });

  describe('then selects a rule', function () {
    before(function () {
      return browser.click(util.name('rule:packs.test' + uniqueId));
    });

    it('should be successful', function () {
      browser.assert.success();
    });

    it('should have correct url', function () {
      browser.assert.url('http://example.com/#/rules/packs.test' + uniqueId + '/general');
    });

    describe('List view', function () {
      it('should highlight the selected row', function () {
        var element = browser.query(util.name('rule:packs.test' + uniqueId));
        expect(element.className).to.have.string('st2-flex-card--active');
      });
    });

    describe('Details view', function () {
      var resource;

      before(function () {
        resource = browser.resources.filter(function (e) {
          return new RegExp('^https://example.com/api/v1/rules/packs.test' + uniqueId + '$').test(e.url);
        });
      });

      it('should make a call to rules endpoint once', function () {
        expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
        expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
      });

      it('should have rule details present', function () {
        var rule = JSON.parse(resource[0].response.body);

        browser.assert.element(util.name('details'), 'Details panel is absent');

        browser.assert.element(util.name('edit_button'), 'Edit button is missing');
        browser.assert.element(util.name('delete_button'), 'Delete button is missing');

        browser.assert.text(util.name('status'), rule.enabled ? 'Enabled' : 'Disabled', 'Wrong status');
        browser.assert.text(util.name('header_name'), rule.ref, 'Wrong ref in header');
        browser.assert.text(util.name('header_description'), rule.description, 'Wrong description in header');
        browser.assert.text(util.name('header_if'), 'If ' + rule.trigger.type, 'Wrong if in header');
        browser.assert.text(util.name('header_then'), 'Then ' + rule.action.ref, 'Wrong then in header');

        browser.assert.element(util.name('rule_trigger_form'), 'Rule trigger form is missing');
        browser.assert.element(util.name('rule_criteria_form'), 'Rule trigger form is missing');
        browser.assert.element(util.name('rule_action_form'), 'Rule action form is missing');

        browser.assert.element(util.name('rule_code'), 'Rule code is missing');
      });
    });

    describe('clicks Edit button', function () {
      before(function () {
        return browser.click(util.name('edit_button'));
      });

      it('should have correct url', function () {
        browser.assert.url('http://example.com/#/rules/packs.test' + uniqueId + '/general?edit=true');
      });

      describe('changes the rule', function () {
        var resource;

        before(function () {
          return browser
            .fill(util.name('field:description').in('details'), 'thing')
            .fill(util.name('field:message').in('rule_action_form').in('details'), '{"a":"b"}')
            .wait()
            .then(function () {
              return browser.pressButton(util.name('save_button'));
            })
            .then(function () {
              resource = browser.resources.filter(function (e) {
                if (e.request.method !== 'PUT') {
                  return false;
                }

                if (!new RegExp('^https://example.com/api/v1/rules/\\w+$').test(e.url)) {
                  return false;
                }

                var rule = JSON.parse(e.response.body);

                return rule.ref === 'packs.test' + uniqueId;
              });
            })
            ;
        });

        it('should make a call to rules endpoint once', function () {
          expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
          expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
        });

        it('should recieve a response containing a number of rules', function () {
          var rule = JSON.parse(resource[0].response.body);

          expect(rule).to.have.property('description', 'thing');
          expect(rule).to.have.deep.property('action.parameters.message')
            .that.deep.equal({a: 'b'});
        });
      });
    });

    describe('and deletes it', function () {
      before(function () {
        return browser.pressButton(util.name('delete_button'));
      });

      it('should be successful', function () {
        browser.assert.success();
      });

      describe('List view', function () {
        var resource;

        before(function () {
          resource = browser.resources.filter(function (e) {
            return e.request.method === 'DELETE' && new RegExp('^https://example.com/api/v1/rules/packs.test' + uniqueId + '$').test(e.url);
          });
        });

        it('should make a call to rules endpoint once', function () {
          expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
          expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
        });

        it('should not have the deleted rule present', function () {
          var element = browser.queryAll(util.name('rule:packs.test' + uniqueId));
          expect(element).to.be.empty;
        });
      });
    });
  });

  after(function () {
    util.client().then(function (client) {
      return client.rules.delete('packs.test' + uniqueId).then(function () {
        console.warn('Warning: Rule "packs.test' + uniqueId + '" has not been properly deleted');
      });
    });
    browser.tabs.closeAll();
  });
});
