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
import { render, fireEvent, act } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import '@stackstorm/module-test-utils/bootstrap/storage';
import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';

import store from '../store';
import RulesPopup from '../rules-popup.component';

const API = 'https://example.com/api/v1';

const TRIGGERS = [{
  ref: 'core.st2.webhook',
  description: 'Webhook',
  parameters_schema: { type: 'object', properties: { url: { type: 'string', required: true }}},
  payload_schema: { type: 'object', properties: { body: {}}},
}, {
  ref: 'core.st2.IntervalTimer',
  description: 'Timer',
  parameters_schema: { type: 'object', properties: { delta: { type: 'integer' }}},
  payload_schema: { type: 'object', properties: {}},
}];

const ACTIONS = [{
  ref: 'core.local',
  description: 'Run a command',
  parameters: { cmd: { type: 'string', required: true }},
}];

const field = (name) => document.querySelector(`[data-test="field:${name}"]`);

// type into a field; comboboxes only report their value on blur
function fill(name, value) {
  const input = field(name);
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value }});
  fireEvent.blur(input);
}

const settle = () => act(() => new Promise(resolve => setTimeout(resolve)));

describe('rules create popup', () => {
  let mock;
  let onNavigate;

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    sinon.stub(notification, 'error');
    sinon.stub(notification, 'success');

    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: []});
    store.dispatch({ type: 'FETCH_TRIGGERS', status: 'success', payload: TRIGGERS });
    store.dispatch({ type: 'FETCH_ACTIONS', status: 'success', payload: ACTIONS });
    store.dispatch({ type: 'FETCH_PACKS', status: 'success', payload: [{ name: 'core', description: 'Core' }]});

    onNavigate = sinon.spy();
    render(
      <Provider store={store}>
        <RulesPopup onNavigate={onNavigate} />
      </Provider>
    );
  });

  afterEach(() => {
    sinon.restore();
    mock.restore();
  });

  function fillRule() {
    fill('name', 'on_hook');
    fill('description', 'Runs on a webhook');
    fill('pack', 'core');
    fill('type', 'core.st2.webhook');
    fill('url', 'deploy');
    fill('ref', 'core.local');
    fill('cmd', 'make deploy');
  }

  it('posts the rule built from the form and opens it', async () => {
    const created = { id: 'r9', ref: 'core.on_hook', pack: 'core', name: 'on_hook' };
    mock.onPost(`${API}/rules`).reply(201, created);

    fillRule();
    fireEvent.click(field('enabled'));
    fireEvent.click(document.querySelector('[data-test="rule_create_submit"]'));
    await settle();

    expect(mock.history.post).to.have.length(1);
    expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({
      name: 'on_hook',
      description: 'Runs on a webhook',
      pack: 'core',
      enabled: false,
      trigger: { type: 'core.st2.webhook', parameters: { url: 'deploy' }},
      criteria: {},
      action: { ref: 'core.local', parameters: { cmd: 'make deploy' }},
    });

    expect(notification.success.calledOnceWith('Rule "core.on_hook" has been created successfully.')).to.be.true;
    expect(onNavigate.calledOnceWith({ id: 'core.on_hook', section: 'general' })).to.be.true;
    expect(store.getState().rules).to.deep.equal([ created ]);
  });

  it('drops the parameters of a trigger when another one is picked', async () => {
    mock.onPost(`${API}/rules`).reply(201, { ref: 'core.on_hook', pack: 'core' });

    fillRule();
    fill('type', 'core.st2.IntervalTimer');
    fireEvent.click(document.querySelector('[data-test="rule_create_submit"]'));
    await settle();

    expect(JSON.parse(mock.history.post[0].data).trigger).to.deep.equal({ type: 'core.st2.IntervalTimer', parameters: {}});
  });

  it('reports a failure and stays open', async () => {
    mock.onPost(`${API}/rules`).reply(400, { faultstring: 'name is taken' });

    fillRule();
    fireEvent.click(document.querySelector('[data-test="rule_create_submit"]'));
    await settle();

    expect(notification.error.calledOnceWith('Unable to create rule.')).to.be.true;
    expect(onNavigate.called).to.be.false;
    expect(store.getState().rules).to.deep.equal([]);
  });

  it('closes on cancel and on Escape without posting', () => {
    fireEvent.click(document.querySelector('.st2-details__toolbar-button'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onNavigate.args).to.deep.equal([[{ id: false }], [{ id: false }]]);
    expect(mock.history.post).to.have.length(0);
  });
});
