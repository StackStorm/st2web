// Copyright 2026 The StackStorm Authors.
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

import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { Provider } from 'react-redux';
import { render, screen, fireEvent, act } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import '@stackstorm/module-test-utils/bootstrap/storage';
import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';

import store from '../store';
import RulesDetails from '../rules-details.component';

const API = 'https://example.com/api/v1';

const ALPHA = {
  id: 'r1',
  ref: 'core.alpha',
  pack: 'core',
  name: 'alpha',
  description: 'Alpha rule',
  enabled: true,
  trigger: { type: 'core.st2.webhook', parameters: { url: 'hook' }, description: 'Webhook' },
  action: { ref: 'core.local', parameters: { cmd: 'date' }, description: 'Run a command' },
  criteria: { 'trigger.body.status': { type: 'equals', pattern: 'ok' }},
};
const BETA = { ...ALPHA, id: 'r2', ref: 'core.beta', name: 'beta', description: 'Beta rule' };

const TRIGGERS = [{
  ref: 'core.st2.webhook',
  description: 'Webhook',
  parameters_schema: { type: 'object', properties: { url: { type: 'string', required: true }}},
  payload_schema: { type: 'object', properties: { body: {}}},
}];

const ACTIONS = [{
  ref: 'core.local',
  description: 'Run a command',
  parameters: { cmd: { type: 'string', required: true }, timeout: { type: 'integer', default: 60 }},
}];

const byTest = (name) => document.querySelector(`[data-test="${name}"]`);
const lines = () => [ ...document.querySelectorAll('.st2-details__line') ]
  .map(el => [ ...el.children ].map(child => child.textContent));
const requests = (method) => mock.history[method].map(({ url }) => url);

// the mocked requests settle within one macrotask; let the store updates they cause happen in act()
const settle = () => act(() => new Promise(resolve => setTimeout(resolve)));

let mock;

// jsdom exposes window.confirm as an accessor, which sinon.stub() cannot replace
const originalConfirm = window.confirm;
function stubConfirm(answer) {
  window.confirm = sinon.stub().returns(answer);
  return window.confirm;
}

async function renderDetails(props = {}) {
  const onNavigate = sinon.spy();
  const element = (extra) => (
    <Provider store={store}>
      <RulesDetails id="core.alpha" section="general" onNavigate={onNavigate} {...props} {...extra} />
    </Provider>
  );

  const { rerender } = render(element());
  await settle();

  return {
    onNavigate,
    rerender: async (extra) => {
      rerender(element(extra));
      await settle();
    },
  };
}

async function click(element) {
  fireEvent.click(element);
  await settle();
}

describe('rules details', () => {
  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onGet(`${API}/packs`).reply(200, []);
    mock.onGet(`${API}/rules/views/core.alpha`).reply(200, ALPHA);
    mock.onGet(`${API}/rules/views/core.beta`).reply(200, BETA);
    mock.onGet(`${API}/ruleenforcements/views`).reply(200, []);

    sinon.stub(notification, 'error');
    sinon.stub(notification, 'success');

    // what the panel loads before the details can render
    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [ ALPHA, BETA ]});
    store.dispatch({ type: 'FETCH_RULE', status: 'success', payload: undefined });
    store.dispatch({ type: 'FETCH_TRIGGERS', status: 'success', payload: TRIGGERS });
    store.dispatch({ type: 'FETCH_ACTIONS', status: 'success', payload: ACTIONS });
    store.dispatch({ type: 'FETCH_PACKS', status: 'success', payload: [{ name: 'core', description: 'Core' }]});
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    sinon.restore();
    mock.restore();
  });

  it('loads and shows the rule with its parameters, defaults and criteria', async () => {
    await renderDetails();

    expect(byTest('header_name').textContent).to.equal('core.alpha');
    expect(byTest('header_description').textContent).to.equal('Alpha rule');
    expect(byTest('condition_if').textContent).to.contain('core.st2.webhook');
    expect(byTest('condition_then').textContent).to.contain('core.local');
    expect(lines()).to.deep.include.members([
      [ 'url', 'hook' ],
      [ 'cmd', 'date' ],
      [ 'timeout', '60' ],
      [ 'pack', 'core' ],
      [ 'trigger.body.status', 'equals', 'ok' ],
    ]);

    const enforcements = mock.history.get.find(({ url }) => url === `${API}/ruleenforcements/views`);
    expect(enforcements.params).to.deep.equal({ rule_ref: 'core.alpha', limit: 10 });
  });

  it('says so when the rule\'s action is not installed', async () => {
    mock.onGet(`${API}/rules/views/core.alpha`).reply(200, { ...ALPHA, action: { ref: 'gone.action', parameters: {}}});

    await renderDetails();

    expect(screen.getByText('Action has not been installed')).to.exist;
  });

  it('shows the code and enforcements sections', async () => {
    mock.onGet(`${API}/ruleenforcements/views`).reply(200, [{
      id: 'enf1',
      enforced_at: '2026-10-01T10:00:00.000Z',
      status: 'succeeded',
      trigger_instance: { trigger: 'core.st2.webhook', payload: {}},
      trigger_instance_id: 'ti1',
    }]);

    const { rerender } = await renderDetails({ section: 'code' });
    expect(byTest('rule_code')).to.exist;

    await rerender({ section: 'enforcements' });
    expect(screen.getByText('enf1')).to.exist;
  });

  it('navigates to another section of the same rule', async () => {
    const { onNavigate } = await renderDetails();

    await click(byTest('switch:enforcements'));

    expect(onNavigate.calledOnceWith({ id: 'core.alpha', section: 'enforcements' })).to.be.true;
  });

  it('saves an edited rule with PUT and reloads it', async () => {
    const saved = { ...ALPHA, action: { ...ALPHA.action, parameters: { cmd: 'uptime' }}};
    mock.onPut(`${API}/rules/r1`).reply(200, saved);

    const { onNavigate } = await renderDetails();
    await click(byTest('edit_button'));

    fireEvent.change(byTest('field:cmd'), { target: { value: 'uptime' }});
    mock.onGet(`${API}/rules/views/core.alpha`).reply(200, saved);
    await click(byTest('save_button'));

    expect(mock.history.put).to.have.length(1);
    const body = JSON.parse(mock.history.put[0].data);
    expect(body.id).to.equal('r1');
    expect(body.action).to.deep.equal({ ref: 'core.local', parameters: { cmd: 'uptime' }, description: 'Run a command' });
    expect(body.trigger).to.deep.equal(ALPHA.trigger);

    expect(notification.success.calledOnceWith('Rule "core.alpha" has been saved successfully.')).to.be.true;
    expect(onNavigate.calledWith({ id: 'core.alpha', section: 'general' })).to.be.true;
    expect(store.getState().rule).to.deep.equal(saved);

    // back to the read-only view, showing the saved value
    expect(byTest('edit_button')).to.exist;
    expect(lines()).to.deep.include([ 'cmd', 'uptime' ]);
  });

  it('reports a failed save', async () => {
    mock.onPut(`${API}/rules/r1`).reply(400, { faultstring: 'invalid' });

    await renderDetails();
    await click(byTest('edit_button'));
    await click(byTest('save_button'));

    expect(notification.error.calledWith('Unable to save rule "core.alpha".')).to.be.true;
    expect(notification.success.called).to.be.false;
    expect(store.getState().rule).to.deep.equal(ALPHA);
  });

  it('throws away the edits on cancel', async () => {
    await renderDetails();
    await click(byTest('edit_button'));

    fireEvent.change(byTest('field:cmd'), { target: { value: 'uptime' }});
    await click(byTest('cancel_button'));

    expect(mock.history.put).to.have.length(0);
    expect(lines()).to.deep.include([ 'cmd', 'date' ]);
  });

  it('leaves edit mode when another rule is shown', async () => {
    const { rerender } = await renderDetails();
    await click(byTest('edit_button'));
    expect(byTest('save_button')).to.exist;

    await rerender({ id: 'core.beta' });

    expect(requests('get')).to.include(`${API}/rules/views/core.beta`);
    expect(byTest('header_name').textContent).to.equal('core.beta');
    expect(byTest('save_button')).to.be.null;
  });

  it('deletes the rule after confirmation', async () => {
    mock.onDelete(`${API}/rules/core.alpha`).reply(204);
    const confirm = stubConfirm(true);

    const { onNavigate } = await renderDetails();
    await click(byTest('delete_button'));

    expect(confirm.calledOnceWith('Do you really want to delete rule "core.alpha"?')).to.be.true;
    expect(requests('delete')).to.deep.equal([ `${API}/rules/core.alpha` ]);
    expect(notification.success.calledOnceWith('Rule "core.alpha" has been deleted successfully.')).to.be.true;
    expect(onNavigate.calledOnceWith({ id: null })).to.be.true;
    expect(store.getState().rules.map(({ ref }) => ref)).to.deep.equal([ 'core.beta' ]);
  });

  it('does not delete without confirmation', async () => {
    stubConfirm(false);

    await renderDetails();
    await click(byTest('delete_button'));

    expect(mock.history.delete).to.have.length(0);
    expect(store.getState().rules).to.have.length(2);
  });

  it('reports a failed delete and keeps the rule', async () => {
    mock.onDelete(`${API}/rules/core.alpha`).reply(500, { faultstring: 'nope' });
    stubConfirm(true);

    const { onNavigate } = await renderDetails();
    await click(byTest('delete_button'));

    expect(notification.error.calledOnceWith('Unable to delete rule "core.alpha".')).to.be.true;
    expect(onNavigate.called).to.be.false;
    expect(store.getState().rules).to.have.length(2);
  });

  it('toggles enabled with a PUT of the whole rule', async () => {
    mock.onPut(`${API}/rules/r1`).reply(({ data }) => [ 200, JSON.parse(data) ]);

    await renderDetails();
    const toggle = document.querySelector('.st2-forms__switch input');
    expect(toggle.checked).to.be.true;

    await click(toggle);

    const body = JSON.parse(mock.history.put[0].data);
    expect(body).to.deep.equal({ ...ALPHA, enabled: false });
    expect(store.getState().rule.enabled).to.equal(false);
    expect(store.getState().rules[0].enabled).to.equal(false);
    expect(document.querySelector('.st2-forms__switch input').checked).to.be.false;
  });

  it('keeps the rule as it was when toggling fails', async () => {
    mock.onPut(`${API}/rules/r1`).reply(500, { faultstring: 'nope' });

    await renderDetails();
    await click(document.querySelector('.st2-forms__switch input'));

    expect(mock.history.put).to.have.length(1);
    expect(store.getState().rule.enabled).to.equal(true);
    expect(document.querySelector('.st2-forms__switch input').checked).to.be.true;
  });
});
