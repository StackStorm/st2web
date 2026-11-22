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

import { describe, it, beforeEach, afterEach, beforeAll, afterAll } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor, configure } from '@testing-library/react';
import { renderNode } from '@stackstorm/module-test-utils';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';
import { ScrollIntoViewContext } from '@stackstorm/module-panel';

import store from '../store';
import TriggersFlexCard from '../triggers-flex-card.component';
import InstancePanel from '../panels/instances';

// st2web marks elements with data-test
configure({ testIdAttribute: 'data-test' });

const URL = 'https://example.com/api/v1';

describe('TriggersFlexCard', () => {
  const trigger = { ref: 'core.st2.CronTimer', name: 'st2.CronTimer', description: 'Triggers on a cron schedule' };

  beforeEach(() => {
    store.dispatch({
      type: 'FETCH_SENSORS',
      status: 'success',
      payload: [{ ref: 'core.TimersSensor', enabled: false, trigger_types: [ 'core.st2.CronTimer' ]}],
    });
  });

  const renderCard = (props) => renderNode(
    <Provider store={store}>
      <TriggersFlexCard trigger={trigger} {...props} />
    </Provider>
  );

  it('shows the trigger name, description and the state of its sensor', () => {
    const card = renderCard();

    expect(card.getAttribute('data-test')).to.equal('trigger trigger:core.st2.CronTimer');
    expect(card.querySelector('.st2-flex-card__header-primary').textContent).to.equal('st2.CronTimer');
    expect(card.querySelector('.st2-flex-card__header-primary').getAttribute('title')).to.equal('core.st2.CronTimer');
    expect(card.querySelector('.st2-flex-card__header-secondary').textContent).to.equal('Triggers on a cron schedule');
    expect(card.querySelector('.st2-flex-card__header-status').textContent).to.equal('Disabled');
    expect(card.classList.contains('st2-flex-card--active')).to.be.false;
  });

  it('shows no status for a trigger type without a sensor', () => {
    const card = renderCard({ trigger: { ...trigger, ref: 'core.st2.webhook' }});

    expect(card.querySelector('.st2-flex-card__header-status').textContent).to.equal('');
  });

  it('is highlighted, scrolled to when selected, and clickable', () => {
    const scrollIntoView = sinon.spy();
    const onClick = sinon.spy();

    const card = renderNode(
      <Provider store={store}>
        <ScrollIntoViewContext value={{ scrollIntoView }}>
          <TriggersFlexCard trigger={trigger} selected onClick={onClick} />
        </ScrollIntoViewContext>
      </Provider>
    );

    expect(card.classList.contains('st2-flex-card--active')).to.be.true;
    expect(scrollIntoView.calledWith(card)).to.be.true;
    fireEvent.click(card);
    expect(onClick.calledOnce).to.be.true;
  });
});

describe('InstancePanel', () => {
  let mock;

  const INSTANCES = [
    { id: 'i1', status: 'processed', occurrence_time: '2026-10-30T12:00:00.000000Z', payload: { executed_at: 'yesterday' }},
    { id: 'i2', status: 'processed', occurrence_time: '2026-10-30T13:00:00.000000Z', payload: { executed_at: 'today' }},
  ];

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: INSTANCES });
  });
  afterEach(() => {
    mock.restore();
  });

  const renderPanel = () => render(
    <Provider store={store}>
      <InstancePanel data-test="trigger_instances" />
    </Provider>
  );
  const rows = () => [ ...document.querySelectorAll('.st2-flex-table__row') ];

  it('lists the instances with their time and status', () => {
    renderPanel();

    expect(rows()).to.have.length(2);
    const [ first ] = rows();
    expect(first.textContent).to.contain('i1').and.contain('Processed');
    expect(first.querySelector('time').getAttribute('datetime')).to.match(/^2026-10-30T/);
    expect(first.querySelector('.icon-chevron_right')).to.exist;
    expect(document.querySelector('.st2-flex-insert')).to.be.null;
  });

  it('shows the rule that enforced an instance when it is expanded', async () => {
    mock.onGet(`${URL}/ruleenforcements/`).reply(200, [{ id: 'enf1', rule: { ref: 'core.notify' }}]);
    renderPanel();

    fireEvent.click(rows()[1]);

    await waitFor(() => expect(document.querySelector('.st2-flex-insert')).to.exist);
    expect(mock.history.get[0].params).to.deep.equal({ trigger_instance: 'i2' });
    const lines = [ ...document.querySelectorAll('.st2-flex-insert dl') ].map((dl) => dl.textContent);
    expect(lines).to.deep.equal([ 'Rulecore.notify', 'Enforcement IDenf1' ]);
    expect(document.querySelector('.st2-flex-insert code').textContent).to.contain('today');
    expect(rows()[1].querySelector('.icon-chevron-down')).to.exist;

    // clicking again folds it back
    fireEvent.click(rows()[1]);
    await waitFor(() => expect(document.querySelector('.st2-flex-insert')).to.be.null);
  });

  it('says so when an instance was never enforced', async () => {
    mock.onGet(`${URL}/ruleenforcements/`).reply(200, []);
    renderPanel();

    fireEvent.click(rows()[0]);

    expect(await screen.findByText('Instance has never been enforced')).to.exist;
  });

  it('says so when there are no instances', () => {
    store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: []});
    renderPanel();

    expect(screen.getByTestId('trigger_instances').textContent).to.equal('No instances of this trigger are present');
  });
});
