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

describe('User visits actions page', function () {
  const browser = new Browser();
  const util = utilFactory(browser);

  this.timeout(20000);

  before(() => browser.visit('/#/actions')
    .then(util.login)
    .then(() => {
      const element = browser.query(util.name('toggle-all'));
      if (element.classList.contains('st2-panel__toolbar-toggle-all--collapsed')) {
        return browser.click(util.name('toggle-all'));
      }

      return browser.click(util.name('toggle-all')).then(() => browser.click(util.name('toggle-all')));
    })
  );

  it('should be successful', () => {
    browser.assert.success();
  });

  it('should have correct url', () => {
    browser.assert.url('http://example.com/#/actions');
  });

  describe('List view', () => {
    let resource;

    before(() => {
      resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/actions(\\?|$)').test(e.url));
    });

    it('should make a call to actions endpoint once', () => {
      expect(resource).to.have.length.at.least(1, 'Actions endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Actions endpoint called several times');
    });

    it('should recieve a response containing a number of actions', () => {
      const actions = JSON.parse(resource[0].response.body);

      expect(actions).to.have.length.of.at.least(1, 'No actions to show');
    });

    it('should have all the actions present', () => {
      const executions = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('action'), executions.length, 'Wrong number of actions');
    });

    it('should highlight the first row', () => {
      const elements = browser.queryAll(util.name('action'));
      expect(elements[0].className).to.have.string('st2-flex-card--active');
    });

    it('should filter actions (case insensitive)', () => {
      return browser.fill(util.name('filter'), 'CORE.').wait()
        .then(() => {
          const actions = browser.queryAll(util.name('action'));

          expect(actions).to.have.length.at.least(1, 'All the actions has been filtered out');
          for (const action of actions) {
            expect(action.getAttribute('data-test')).to.have.string('action:core.');
          }
        })
        .then(() => browser.fill(util.name('filter'), '').wait())
      ;
    });
  });

  describe('Details view', () => {
    let resource;

    before(() => {
      resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/actions/views/overview/[\\w.-]+$').test(e.url));
    });

    it('should make a call to actions endpoint', () => {
      // NOTE: expecting 3 calls because of filtering
      expect(resource).to.have.length.at.least(3, 'Execution endpoint has not been called');
      expect(resource).to.have.length.at.most(3, 'Execution endpoint called several times');
    });

    it('should recieve a response containing an action', () => {
      const action = JSON.parse(resource[0].response.body);

      expect(action).to.be.an('object');
    });

    it('should have action details present', () => {
      const action = JSON.parse(resource[0].response.body);

      browser.assert.element(util.name('details'), 'Details panel is absent');

      // browser.assert.element(util.name('flow_link'), 'Flow link is missing');

      browser.assert.text(util.name('header_name'), action.ref, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), action.description, 'Wrong description in header');

      browser.assert.element(util.name('action_parameters'), 'Action parameters are missing');
    });

    describe('then chooses code tab', () => {
      before(() => browser.click(util.name('switch:code')));
      after(() => browser.click(util.name('switch:general')));

      it('should have action code present', () => {
        try {
          browser.assert.element(util.name('action_code'));
        }
        catch (e) {
          browser.assert.element(util.name('no_code_message'), 'Action code and a message are both missing');
        }
      });
    });

    describe('then chooses executions tab', () => {
      before(() => browser.click(util.name('switch:executions')));
      after(() => browser.click(util.name('switch:general')));

      it('should have action executions present', () => {
        try {
          browser.assert.element(util.name('action_executions'));
        }
        catch (e) {
          browser.assert.element(util.name('no_executions_message'), 'Action executions and an error message are both missing');
        }
      });
    });
  });

  describe('then selects an action', () => {
    before(() => browser.click(util.name('action:core.announcement')));

    it('should be successful', () => {
      browser.assert.success();
    });

    it('should have correct url', () => {
      browser.assert.url('http://example.com/#/actions/core.announcement');
    });

    describe('List view', () => {
      it('should highlight the selected row', () => {
        const element = browser.query(util.name('action:core.announcement'));
        expect(element.className).to.have.string('st2-flex-card--active');
      });

      it('should expand the pack', () => {
        const element = browser.query(util.name('pack:core'));
        expect(element.className).to.not.have.string('st2-flex-table--collapsed');
      });
    });

    describe('Details view', () => {
      let resource;

      before(() => {
        resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/actions/views/overview/core.announcement$').test(e.url));
      });

      it('should make a call to actions endpoint', () => {
        // NOTE: expecting 2 calls because of filtering
        expect(resource).to.have.length.at.least(2, 'Actions endpoint has not been called');
        expect(resource).to.have.length.at.most(2, 'Actions endpoint called several times');
      });

      it('should recieve a response containing an action', () => {
        const action = JSON.parse(resource[0].response.body);

        expect(action).to.be.an('object')
          .and.have.property('ref', 'core.announcement');
      });

      it('should have action details present', () => {
        const action = JSON.parse(resource[0].response.body);

        browser.assert.element(util.name('details'), 'Details panel is absent');

        browser.assert.text(util.name('header_name'), action.ref, 'Wrong ref in header');
        browser.assert.text(util.name('header_description'), action.description, 'Wrong description in header');

        browser.assert.element(util.name('action_parameters'), 'Action parameters are missing');
      });

      describe('then chooses code tab', () => {
        before(() => browser.click(util.name('switch:code')));
        after(() => browser.click(util.name('switch:general')));

        it('should have action code present', () => {
          try {
            browser.assert.element(util.name('action_code'));
          }
          catch (e) {
            browser.assert.element(util.name('no_code_message'), 'Action code and a message are both missing');
          }
        });
      });

      describe('then chooses executions tab', () => {
        before(() => browser.click(util.name('switch:executions')));
        after(() => browser.click(util.name('switch:general')));
  
        it('should have action executions present', () => {
          try {
            browser.assert.element(util.name('action_executions'));
          }
          catch (e) {
            browser.assert.element(util.name('no_executions_message'), 'Action executions and an error message are both missing');
          }
        });
      });
    });

    describe('and runs it', () => {
      let resource;

      before(() => browser
        .fill(util.name('field:route'), 'test')
        .fill(util.name('field:message'), '{ "passed": true }')
        .pressButton(util.name('run_submit'))
        .then(() => {
          resource = browser.resources.filter((e) => e.request.method === 'POST' && new RegExp('^https://example.com/api/v1/executions$').test(e.url));
        })
      );

      it('should make a call to executions endpoint once', () => {
        expect(resource).to.have.length.at.least(1, 'Executions endpoint has not been called');
        expect(resource).to.have.length.at.most(1, 'Executions endpoint called several times');
      });
    });

  });

  describe('then selects an action with a specific parameter and fills it', () => {
    before(() => browser
      .click(util.name('action:core.local'))
      .then(() => browser.fill(util.name('field:cmd'), 'test'))
    );

    it('should have parameter filled', () => {
      browser.assert.input(util.name('field:cmd'), 'test', 'Field have not been filled');
    });

    describe('then selects another action with the same parameter', () => {
      before(() => browser.click(util.name('action:core.local_sudo')));

      it('should have empty parameter', () => {
        browser.assert.input(util.name('field:cmd'), '', 'Field have not been reset');
      });
    });
  });

  after(() => {
    browser.tabs.closeAll();
  });
});
