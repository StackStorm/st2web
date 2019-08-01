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

describe('User visits rules page', function () {
  const browser = new Browser();
  const util = utilFactory(browser);

  this.timeout(10000);

  const uniqueId = `_${Math.random().toString(36).substr(2, 9)}`;

  before(() => browser.visit('/#/rules').then(util.login));

  it('should be successful', () => {
    browser.assert.success();
  });

  it('should have correct url', () => {
    browser.assert.url('http://example.com/#/rules');
  });

  describe('List view', () => {
    let resource;

    before(() => {
      resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/rules/views$').test(e.url));
    });

    it('should make a call to rules endpoint once', () => {
      expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
    });

    it('should recieve a response containing a number of rules', () => {
      const rules = JSON.parse(resource[0].response.body);

      expect(rules).to.have.length.of.at.least(1, 'No rules to show');
    });

    it('should have all the rules present', () => {
      const rules = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('rule'), rules.length, 'Wrong number of rules');
    });

    it('should highlight the first row', () => {
      const elements = browser.queryAll(util.name('rule'));
      expect(elements[0].className).to.have.string('st2-flex-card--active');
    });

    it('should filter rules (case insensitive)', () => {
      return browser.fill(util.name('filter'), 'cHatoPs.').wait()
        .then(() => {
          const rules = browser.queryAll(util.name('rule'));

          expect(rules).to.have.length.at.least(0, 'All the rules has been filtered out');
          for (const rule of rules) {
            expect(rule.getAttribute('data-test')).to.have.string('rule:chatops.');
          }
        })
        .then(() => browser.fill(util.name('filter'), '').wait())
      ;
    });
  });

  describe('Details view', () => {
    let resource;
    let rules;
    let rule;

    before(() => {
      resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/rules/views$').test(e.url));
    });

    it('should make a call to rules endpoint', () => {
      expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
    });

    it('should recieve a response containing a rule', () => {
      rules = JSON.parse(resource[0].response.body);
      rule = rules[0];

      expect(rule).to.be.an('object');
    });

    it('should have rule details present', () => {
      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.element(util.name('edit_button'), 'Edit button is missing');
      browser.assert.element(util.name('delete_button'), 'Delete button is missing');

      browser.assert.text(util.name('status'), rule.enabled ? 'Enabled' : 'Disabled', 'Wrong status');
      browser.assert.text(util.name('header_name'), rule.ref, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), rule.description, 'Wrong description in header');
      browser.assert.text(util.name('condition_if'), `If${rule.trigger.type}${rule.trigger.description || ''}`, 'Wrong if in header');
      browser.assert.text(util.name('condition_then'), `Then${rule.action.ref}${rule.action.description || ''}`, 'Wrong then in header');
    });

    describe('then chooses code tab', () => {
      before(() => browser.click(util.name('switch:code')));
      after(() => browser.click(util.name('switch:general')));

      it('should have rule code present', () => {
        browser.assert.element(util.name('rule_code'));
      });
    });
  });

  describe('then opens a new rule popup', () => {
    before(() => browser.click(util.name('rule_create_button')));

    it('should have correct url', () => {
      browser.assert.url('http://example.com/#/rules/new');
    });

    it('should show a popup', () => {
      browser.assert.element(util.name('rule_create_popup'), 'Rule create popup is absent');
    });

    describe('then creates a new rule', () => {
      let resource;

      before(() => browser
        .fill(util.name('field:name').in('rule_create_popup'), `test${uniqueId}`)
        .fill(util.name('field:description').in('rule_create_popup'), 'some')
        .fill(util.name('field:pack').in('rule_create_popup'), 'packs')
        .uncheck(util.name('field:enabled').in('rule_create_popup'))
        .fill(util.name('field:type').in('rule_create_trigger_form').in('rule_create_popup'), 'core.st2.sensor.process_exit')
        .fill(util.name('field:ref').in('rule_create_action_form').in('rule_create_popup'), 'core.announcement')
        .wait()
        .then(() => browser.pressButton(util.name('rule_create_submit')))
        .then(() => {
          resource = browser.resources.filter((e) => e.request.method === 'POST' && new RegExp('^https://example.com/api/v1/rules$').test(e.url));
        })
      );

      it('should make a call to rules endpoint once', () => {
        expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
        expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
      });
    });
  });

  describe('then selects the rule', () => {
    before(() => browser.click(util.name(`rule:packs.test${uniqueId}`)));

    it('should be successful', () => {
      browser.assert.success();
    });

    it('should have correct url', () => {
      browser.assert.url(`http://example.com/#/rules/packs.test${uniqueId}`);
    });

    describe('List view', () => {
      it('should highlight the selected row', () => {
        const element = browser.query(util.name(`rule:packs.test${uniqueId}`));
        expect(element.className).to.have.string('st2-flex-card--active');
      });
    });

    describe('Details view', () => {
      let resource;

      before(() => {
        resource = browser.resources.filter((e) => {
          return (
            e.request.method === 'POST' && e.url.match(new RegExp('^https://example.com/api/v1/rules'))
          ) || (
            e.request.method === 'GET' && e.url.match(new RegExp(`^https://example.com/api/v1/rules/views/packs.test${uniqueId}`))
          );
        });
      });

      it('should make a call to rules endpoint', () => {
        expect(resource).to.have.length.at.least(2, 'Rules endpoint has not been called');
        expect(resource).to.have.length.at.most(2, 'Rules endpoint called several times');
      });

      it('should have rule details present', () => {
        const rule = JSON.parse(resource[1].response.body);

        browser.assert.element(util.name('details'), 'Details panel is absent');

        browser.assert.element(util.name('edit_button'), 'Edit button is missing');
        browser.assert.element(util.name('delete_button'), 'Delete button is missing');

        browser.assert.text(util.name('status'), rule.enabled ? 'Enabled' : 'Disabled', 'Wrong status');
        browser.assert.text(util.name('header_name'), rule.ref, 'Wrong ref in header');
        browser.assert.text(util.name('header_description'), rule.description, 'Wrong description in header');
        browser.assert.text(util.name('condition_if'), `If${rule.trigger.type}${rule.trigger.description || ''}`, 'Wrong if in header');
        browser.assert.text(util.name('condition_then'), `Then${rule.action.ref}${rule.action.description || ''}`, 'Wrong then in header');
      });

      describe('then chooses code tab', () => {
        before(() => browser.click(util.name('switch:code')));
        after(() => browser.click(util.name('switch:general')));

        it('should have rule code present', () => {
          try {
            browser.assert.element(util.name('rule_code'));
          }
          catch (e) {
            browser.assert.element(util.name('no_code_message'), 'Action code and a message are both missing');
          }
        });
      });
    });

    describe('clicks Edit button', () => {
      let resource;

      before(() => browser.click(util.name('edit_button')));

      before(() => {
        resource = browser.resources.filter((e) => {
          return e.request.method === 'GET' && e.url.match(new RegExp(`^https://example.com/api/v1/rules/views/packs.test${uniqueId}`));
        });
      });

      it('should have rule details present', () => {
        const rule = JSON.parse(resource[0].response.body);

        browser.assert.element(util.name('details'), 'Details panel is absent');

        browser.assert.element(util.name('save_button'), 'Save button is missing');
        browser.assert.element(util.name('cancel_button'), 'Cancel button is missing');
        
        browser.assert.text(util.name('status'), rule.enabled ? 'Enabled' : 'Disabled', 'Wrong status');
        browser.assert.text(util.name('header_name'), rule.ref, 'Wrong ref in header');
        browser.assert.text(util.name('header_description'), rule.description, 'Wrong description in header');
        browser.assert.text(util.name('condition_if'), `If${rule.trigger.type}${rule.trigger.description || ''}`, 'Wrong if in header');
        browser.assert.text(util.name('condition_then'), `Then${rule.action.ref}${rule.action.description || ''}`, 'Wrong then in header');

        browser.assert.element(util.name('rule_trigger_form'), 'Rule trigger form is missing');
        browser.assert.element(util.name('rule_criteria_form'), 'Rule trigger form is missing');
        browser.assert.element(util.name('rule_action_form'), 'Rule action form is missing');
      });

      describe('changes the rule', () => {
        let resource;

        before(() => browser
          .fill(util.name('field:description').in('details'), 'thing')
          .fill(util.name('field:message').in('rule_action_form').in('details'), '{"a":"b"}')
          .wait()
          .then(() => browser.pressButton(util.name('save_button')))
          .then(() => {
            resource = browser.resources.filter((e) => {
              if (e.request.method !== 'PUT') {
                return false;
              }

              if (!new RegExp('^https://example.com/api/v1/rules/\\w+$').test(e.url)) {
                return false;
              }

              const rule = JSON.parse(e.response.body);

              return rule.ref === `packs.test${uniqueId}`;
            });
          })
        );

        it('should make a call to rules endpoint once', () => {
          expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
          expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
        });

        it('should recieve a response containing a number of rules', () => {
          const rule = JSON.parse(resource[0].response.body);

          expect(rule).to.have.property('description', 'thing');
          expect(rule).to.have.nested.property('action.parameters.message')
            .that.deep.equal({a: 'b'});
        });
      });
    });

    describe('and deletes it', () => {
      before(() => browser.pressButton(util.name('delete_button')));

      it('should be successful', () => {
        browser.assert.success();
      });

      describe('List view', () => {
        let resource;

        before(() => {
          resource = browser.resources.filter((e) => {
            if (e.request.method !== 'DELETE') {
              return false;
            }

            if (!new RegExp(`^https://example.com/api/v1/rules/packs.test${uniqueId}$`).test(e.url)) {
              return false;
            }

            return true;
          });
        });

        it('should make a call to rules endpoint once', () => {
          expect(resource).to.have.length.at.least(1, 'Rules endpoint has not been called');
          expect(resource).to.have.length.at.most(1, 'Rules endpoint called several times');
        });

        it('should not have the deleted rule present', () => {
          const element = browser.queryAll(util.name(`rule:packs.test${uniqueId}`));
          expect(element).to.be.empty;
        });
      });
    });
  });

  after(() => {
    util.client().then((client) => {
      return client.request({
        mathod: 'delete',
        url: `/rules/packs.test${uniqueId}`,
      })
        .then(() => console.warn(`Warning: Rule "packs.test${uniqueId}" has not been properly deleted`)) // eslint-disable-line no-console
        .catch(() => {})
      ;
    });
    browser.tabs.closeAll();
  });
});
