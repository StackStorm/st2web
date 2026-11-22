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
import router from '@stackstorm/module-router/methods';
import globalStore from '@stackstorm/module-store';

import store from '../store';
import Rules from '../rules.component';

const API = 'https://example.com/api/v1';

const rule = (pack, name) => ({
  id: `${pack}-${name}`,
  ref: `${pack}.${name}`,
  pack,
  name,
  description: `Rule ${name}`,
  enabled: true,
  trigger: { type: 'core.st2.webhook', parameters: {}},
  action: { ref: 'core.local', parameters: { cmd: 'date' }},
  criteria: {},
});

const RULES = [ rule('linux', 'check'), rule('core', 'beta'), rule('core', 'alpha') ];

const TRIGGERS = [{
  ref: 'core.st2.webhook',
  description: 'Webhook',
  parameters_schema: { type: 'object', properties: { url: { type: 'string' }}},
  payload_schema: { type: 'object', properties: { body: {}}},
}];

const ACTIONS = [{ ref: 'core.local', description: 'Local', parameters: { cmd: { type: 'string' }}}];

const byTest = (name) => document.querySelector(`[data-test="${name}"]`);
const card = (ref) => document.querySelector(`[data-test="rule rule:${ref}"]`);
const cards = () => [ ...document.querySelectorAll('.st2-flex-card') ].map(el => el.getAttribute('data-test').split(':')[1]);
const pathname = () => globalStore.getState().location.pathname;

// The mocked requests (and the requests they lead to) settle within one macrotask; let the
// store updates they cause happen inside act().
const settle = () => act(() => new Promise(resolve => setTimeout(resolve)));

async function renderAt(path) {
  router.push({ pathname: path });

  render(
    <Provider store={globalStore}>
      <Rules routes={[]} />
    </Provider>
  );

  await settle();
}

async function click(element) {
  fireEvent.click(element);
  await settle();
}

describe('rules panel', () => {
  let mock;

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onGet(`${API}/packs`).reply(200, [{ ref: 'core', name: 'core', description: 'Core' }]);
    mock.onGet(`${API}/triggertypes`).reply(200, TRIGGERS);
    mock.onGet(`${API}/actions/views/overview`).reply(200, ACTIONS);
    mock.onGet(`${API}/rules/views`).reply(200, RULES);
    mock.onGet(/\/rules\/views\/.+/).reply(({ url }) => {
      const found = RULES.find(({ ref }) => url.endsWith(`/${ref}`));
      return found ? [ 200, found ] : [ 404, { faultstring: 'not found' }];
    });
    mock.onGet(`${API}/ruleenforcements/views`).reply(200, []);

    sinon.stub(notification, 'error');
    sinon.stub(notification, 'success');

    // the rules store outlives each render
    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: []});
    store.dispatch({ type: 'FETCH_RULE', status: 'success', payload: undefined });
  });

  afterEach(() => {
    sinon.restore();
    mock.restore();
  });

  it('lists the rules by pack and shows the first one when none is selected', async () => {
    await renderAt('/rules');

    expect(cards()).to.deep.equal([ 'core.alpha', 'core.beta', 'linux.check' ]);

    const titles = [ ...document.querySelectorAll('.st2-flex-table__caption-title') ].map(el => el.textContent);
    expect(titles).to.deep.equal([ 'core', 'linux' ]);
    expect(card('core.alpha').classList.contains('st2-flex-card--active')).to.be.true;
    expect(card('core.alpha').textContent).to.contain('Rule alpha');

    expect(byTest('header_name').textContent).to.equal('core.alpha');
    expect(mock.history.get.some(({ url }) => url === `${API}/rules/views/core.alpha`)).to.be.true;

    // the list and the specs come from the API, with only the attributes the forms use
    const packs = mock.history.get.find(({ url, params }) => url === `${API}/packs` && params);
    expect(packs.params).to.deep.equal({ include_attributes: 'name,description' });
  });

  it('filters the list as the user types', async () => {
    await renderAt('/rules');

    // the first visible rule is the selected one, so filtering also loads another rule
    fireEvent.change(byTest('filter'), { target: { value: 'LIN' }});
    await settle();

    expect(cards()).to.deep.equal([ 'linux.check' ]);
    expect(byTest('header_name').textContent).to.equal('linux.check');

    fireEvent.change(byTest('filter'), { target: { value: 'missing' }});
    await settle();

    expect(cards()).to.deep.equal([]);
    expect(screen.getByText('No results were found for your current filter.')).to.exist;
  });

  it('navigates to a rule when its card is clicked and loads it', async () => {
    await renderAt('/rules');

    await click(card('linux.check'));

    expect(pathname()).to.equal('/rules/linux.check');
    expect(byTest('header_name').textContent).to.equal('linux.check');
    expect(card('linux.check').classList.contains('st2-flex-card--active')).to.be.true;
    expect(card('core.alpha').classList.contains('st2-flex-card--active')).to.be.false;
  });

  it('keeps the section when switching between rules', async () => {
    await renderAt('/rules/core.alpha/code');
    expect(byTest('rule_code')).to.exist;

    await click(card('core.beta'));

    expect(pathname()).to.equal('/rules/core.beta/code');
  });

  it('drops a rule from the URL that is not in the list', async () => {
    await renderAt('/rules/core.gone');

    expect(pathname()).to.equal('/rules');
  });

  it('reports a failure to load the rules', async () => {
    mock.onGet(`${API}/rules/views`).reply(500, { faultstring: 'boom' });

    await renderAt('/rules');

    expect(notification.error.calledWith('Unable to retrieve rules.')).to.be.true;
    expect(cards()).to.deep.equal([]);
  });

  it('opens the create popup from the toolbar', async () => {
    await renderAt('/rules');

    await click(byTest('rule_create_button'));

    expect(pathname()).to.equal('/rules/new');
    expect(byTest('rule_create_popup')).to.exist;
  });
});
