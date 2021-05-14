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

describe('User visits history page', function () {
  const browser = new Browser();
  const util = utilFactory(browser);

  this.timeout(10000);

  before(() => browser.visit('/#/history')
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
    browser.assert.url('http://example.com/#/history');
  });

  describe('List view', () => {
    let resource;

    before(() => {
      resource = browser.resources.filter((e) =>
        ~e.url.indexOf('https://example.com/api/v1/executions?') // eslint-disable-line no-bitwise
      );
    });

    it('should make a call to executions endpoint once', () => {
      expect(resource).to.have.length.at.least(1, 'Executions endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Executions endpoint called several times');
    });

    it('should recieve a response containing a number of executions', () => {
      const executions = JSON.parse(resource[0].response.body);

      expect(executions).to.have.length.of.at.least(1, 'No executions to show');
      expect(executions).to.have.length.of.at.most(50, 'Too many executions');
    });

    it('should have all the executions present', () => {
      const executions = JSON.parse(resource[0].response.body);

      browser.assert.elements(util.name('execution'), executions.length, 'Wrong number of executions');
    });
  });

  describe('Details view', () => {
    let resource;

    before(() => {
      resource = browser.resources.filter((e) => new RegExp('^https://example.com/api/v1/executions/\\w+\\?max_result_size=102400$').test(e.url));
    });

    it('should make a call to execution endpoint once', () => {
      expect(resource).to.have.length.at.least(1, 'Execution endpoint has not been called');
      expect(resource).to.have.length.at.most(1, 'Execution endpoint called several times');
    });

    it('should recieve a response containing an execution', () => {
      const execution = JSON.parse(resource[0].response.body);

      expect(execution).to.be.an('object');
    });

    it('should have execution details present', () => {
      const execution = JSON.parse(resource[0].response.body);

      browser.assert.element(util.name('details'), 'Details panel is absent');

      browser.assert.element(util.name('rerun_button'), 'Rerun button is missing');

      browser.assert.text(util.name('header_name'), execution.action.ref, 'Wrong ref in header');
      browser.assert.text(util.name('header_description'), execution.action.description, 'Wrong description in header');

      browser.assert.text(util.name('status'), util.capitalize(execution.status), 'Wrong status');
      browser.assert.text(util.name('execution_id'), execution.id, 'Wrong execution id');
      browser.assert.text(util.name('start_timestamp'), util.formatLocal(execution.start_timestamp), 'Wrong start time');
      browser.assert.text(util.name('end_timestamp'), util.formatLocal(execution.end_timestamp), 'Wrong end time');

      const execution_time = Math.ceil((new Date(execution.end_timestamp).getTime() - new Date(execution.start_timestamp).getTime()) / 1000);
      browser.assert.text(util.name('execution_time'), `${execution_time}s`, 'Wrong execution time');

      browser.assert.element(util.name('action_output'), 'Action output is missing');
      browser.assert.element(util.name('action_input'), 'Action input is missing');
    });

    describe('then chooses code tab', () => {
      before(() => browser.click(util.name('switch:code')));
      after(() => browser.click(util.name('switch:general')));

      it('should have execution code present', () => {
        try {
          browser.assert.element(util.name('execution_code'));
        }
        catch (e) {
          browser.assert.element(util.name('no_code_message'), 'Action code and a message are both missing');
        }
      });
    });
  });

  describe('Rerun', () => {
    it('should be closed initially', () => {
      browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
    });

    it('should open on button click', () => {
      browser.assert.element(util.name('rerun_button'), 'Rerun button is not in DOM');
      browser.pressButton(util.name('rerun_button'))
        .then(() => {
          browser.assert.element(util.name('rerun_popup'), 'Rerun is not in DOM');
        });
    });

    it('should show a form', () => {
      return browser.pressButton(util.name('rerun_button'))
        .then(() => {
          browser.assert.element(util.name('rerun_form_action'), 'Action input is missing');
          browser.assert.element(util.name('rerun_preview'), 'Preview button is missing');
          browser.assert.element(util.name('rerun_cancel'), 'Cancel button is missing');
          browser.assert.element(util.name('rerun_submit'), 'Submit button is missing');
        })
      ;
    });

    it('should rerun the action on submit button', () => {
      return browser.pressButton(util.name('rerun_submit'))
        .then(() => new Promise(resolve => setTimeout(resolve, 2500)))
        .then(() => {
          const resource = browser.resources.filter((e) => {
            if (e.request.method !== 'POST') {
              return false;
            }

            return new RegExp('^https://example.com/api/v1/executions/\\w+/re_run\\?no_merge=true$').test(e.url);
          });

          expect(resource).to.have.length(1, 'Rerun should make a single request');

          browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
        })
      ;
    });

    it('should close the popup on cancel button', () => {
      return browser.pressButton(util.name('rerun_button'))
        .then(() => {
          browser.assert.element(util.name('rerun_popup'), 'Rerun is not in DOM');
        })
        .then(() => browser.pressButton(util.name('rerun_cancel')))
        .then(() => {
          browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
        })
      ;
    });

    it('should close the popup on clicking outside the view', () => {
      return browser.pressButton(util.name('rerun_button'))
        .then(() => {
          browser.assert.element(util.name('rerun_popup'), 'Rerun is not in DOM');
        })
        .then(() => {
          browser.click(util.name('rerun_popup'));
        })
        .then(() => {
          browser.assert.elements(util.name('rerun_popup'), 0, 'Rerun popup is in DOM when it should not be');
        })
      ;
    });
  });

  after(() => {
    browser.tabs.closeAll();
  });
});
