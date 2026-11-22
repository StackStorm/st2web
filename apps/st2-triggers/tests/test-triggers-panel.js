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
import { render, screen, fireEvent, within, waitFor, configure } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import rootStore from '@stackstorm/module-store';
import router, { Route } from '@stackstorm/module-router';

import store from '../store';
import Triggers from '../triggers.component';
import TriggersPanel from '../triggers-panel.component';

// st2web marks elements with data-test
configure({ testIdAttribute: 'data-test' });

const URL = 'https://example.com/api/v1';

const TRIGGERS = [
  {
    ref: 'core.st2.CronTimer',
    pack: 'core',
    name: 'st2.CronTimer',
    description: 'Triggers on a cron schedule',
    parameters_schema: { properties: {
      timezone: { type: 'string' },
      second: { type: 'integer', description: 'Second of the minute' },
    }},
    payload_schema: { properties: {
      executed_at: { type: 'string', description: 'Time of the run' },
    }},
  },
  { ref: 'core.st2.webhook', pack: 'core', name: 'st2.webhook', description: 'Webhook' },
  { ref: 'linux.file_watch.line', pack: 'linux', name: 'file_watch.line', description: 'Line in a file' },
];

const SENSORS = [
  { ref: 'core.TimersSensor', enabled: true, trigger_types: [ 'core.st2.CronTimer' ]},
  { ref: 'linux.FileWatchSensor', enabled: false, trigger_types: [ 'linux.file_watch.line' ]},
];

const INSTANCES = [
  { id: 'inst1', status: 'processed', occurrence_time: '2026-10-30T12:00:00.000000Z', payload: {}},
];

// The details panel and the app shell take the current location from the root store.
function renderPanel(pathname) {
  router.push({ pathname });

  return render(
    <Provider store={rootStore}>
      <Route
        path='/triggers/:ref?/:section?'
        render={({ match, location }) => (
          <Provider store={store}>
            <TriggersPanel match={match} location={location} />
          </Provider>
        )}
      />
    </Provider>
  );
}

const pathname = () => rootStore.getState().location.pathname;
const cards = () => screen.queryAllByTestId(/^trigger trigger:/).map((card) => card.getAttribute('data-test').slice(16));
const groupTitles = () => [ ...document.querySelectorAll('.st2-flex-table__caption-title') ].map((el) => el.textContent);
const headerName = () => screen.getByTestId('header_name').textContent;
const lines = (panel) => [ ...panel.querySelectorAll('.st2-details__line') ].map((line) => [
  line.querySelector('.st2-details__line-name').textContent,
  line.querySelector('.st2-details__line-value').textContent,
]);
const detailsPanel = (title) => screen.getByRole('heading', { name: title }).closest('.st2-details__panel');

describe('TriggersPanel', () => {
  let mock;

  // Run `change` and wait for the instances it makes the details fetch to reach the store.
  async function instancesRefetched(change) {
    const count = mock.history.get.filter(({ url }) => url === `${URL}/triggerinstances`).length;
    const before = store.getState().instances;
    change();
    await waitFor(() => {
      expect(mock.history.get.filter(({ url }) => url === `${URL}/triggerinstances`)).to.have.length(count + 1);
      expect(store.getState().instances).to.not.equal(before);
    });
  }

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    // start from an empty store, so nothing renders before this test's requests come back
    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: []});
    store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: []});
    store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: []});

    mock = new MockAdapter(axios);
    mock.onGet(`${URL}/triggertypes`).reply(200, TRIGGERS);
    mock.onGet(`${URL}/sensortypes`).reply(200, SENSORS);
    // a fresh list each time, so a test can tell when a refetch has landed
    mock.onGet(`${URL}/triggerinstances`).reply(() => [ 200, INSTANCES.map((instance) => ({ ...instance })) ]);
    // pack icons in the group titles
    mock.onGet(`${URL}/packs`).reply(200, []);

    sinon.stub(notification, 'error');
  });
  afterEach(() => {
    mock.restore();
    sinon.restore();
  });

  it('lists trigger types grouped by pack and shows the first one', async () => {
    renderPanel('/triggers');

    await screen.findByTestId('details');

    expect(groupTitles()).to.deep.equal([ 'core', 'linux' ]);
    expect(cards()).to.deep.equal([ 'core.st2.CronTimer', 'core.st2.webhook', 'linux.file_watch.line' ]);
    expect(screen.getByTestId('trigger trigger:core.st2.CronTimer').classList.contains('st2-flex-card--active')).to.be.true;
    expect(headerName()).to.equal('core.st2.CronTimer');
    await waitFor(() => expect(screen.getByTestId('trigger trigger:linux.file_watch.line').textContent).to.contain('Disabled'));
    expect(document.title).to.contain('core.st2.CronTimer - Trigger Types');
  });

  it('narrows the list as the filter is typed', async () => {
    renderPanel('/triggers');
    await screen.findByTestId('details');
    await waitFor(() => expect(store.getState().instances).to.have.length(1));

    // the shown trigger type follows the filter, and its instances are fetched again
    await instancesRefetched(() => fireEvent.change(screen.getByTestId('filter'), { target: { value: 'FILE' }}));
    expect(cards()).to.deep.equal([ 'linux.file_watch.line' ]);
    expect(groupTitles()).to.deep.equal([ 'linux' ]);
    expect(headerName()).to.equal('linux.file_watch.line');

    await instancesRefetched(() => fireEvent.change(screen.getByTestId('filter'), { target: { value: 'nothing' }}));
    expect(cards()).to.deep.equal([]);
    expect(screen.getByText('No results were found for your current filter.')).to.exist;
  });

  it('navigates to a trigger type when its card is clicked', async () => {
    renderPanel('/triggers');
    await screen.findByTestId('details');

    fireEvent.click(screen.getByTestId('trigger trigger:linux.file_watch.line'));

    expect(pathname()).to.equal('/triggers/linux.file_watch.line');
    await waitFor(() => expect(headerName()).to.equal('linux.file_watch.line'));
    expect(screen.getByTestId('trigger trigger:linux.file_watch.line').classList.contains('st2-flex-card--active')).to.be.true;
  });

  it('collapses and expands every group', async () => {
    renderPanel('/triggers');
    await screen.findByTestId('details');

    fireEvent.click(screen.getByTestId('toggle-all'));
    expect(cards()).to.deep.equal([]);

    fireEvent.click(screen.getByTestId('toggle-all'));
    expect(cards()).to.have.length(3);
  });

  it('reports trigger types that could not be loaded', async () => {
    mock.onGet(`${URL}/triggertypes`).reply(500, { faultstring: 'boom' });

    const { container } = renderPanel('/triggers');

    await waitFor(() => expect(notification.error.calledOnce).to.be.true);
    expect(notification.error.firstCall.args[0]).to.equal('Unable to retrieve trigger types.');
    expect(container.innerHTML).to.equal('');
  });

  it('reports sensor types that could not be loaded, but still lists the trigger types', async () => {
    mock.onGet(`${URL}/sensortypes`).reply(500, { faultstring: 'boom' });

    renderPanel('/triggers');

    await waitFor(() => expect(notification.error.calledOnce).to.be.true);
    expect(notification.error.firstCall.args[0]).to.equal('Unable to retrieve sensor types.');
    await screen.findByTestId('details');
    expect(cards()).to.have.length(3);
  });

  describe('details', () => {
    it('shows the sensor, parameters and payload of the trigger type', async () => {
      renderPanel('/triggers/core.st2.CronTimer');
      await screen.findByTestId('details');

      expect(within(screen.getByTestId('header_name')).getByRole('link').getAttribute('href'))
        .to.equal('#/triggers/core.st2.CronTimer');
      expect(screen.getByTestId('header_description').textContent).to.equal('Triggers on a cron schedule');

      await waitFor(() => expect(screen.getByTestId('status').textContent).to.equal('Enabled'));
      expect(lines(detailsPanel('Sensor'))).to.deep.equal([[ 'ref', 'core.TimersSensor' ]]);
      expect(within(detailsPanel('Sensor')).getByRole('checkbox').checked).to.be.true;

      expect(lines(detailsPanel('Parameters'))).to.deep.equal([
        [ 'timezone', '' ],
        [ 'second', 'Second of the minute' ],
      ]);
      expect(lines(detailsPanel('Payload'))).to.deep.equal([[ 'executed_at', 'Time of the run' ]]);
    });

    it('says so when a trigger type has no sensor, parameters or payload', async () => {
      renderPanel('/triggers/core.st2.webhook');
      await waitFor(() => expect(headerName()).to.equal('core.st2.webhook'));

      expect(screen.queryByRole('heading', { name: 'Sensor' })).to.be.null;
      expect(screen.queryByTestId('status')).to.be.null;
      expect(screen.getByText('Trigger type does not have any parameters')).to.exist;
      expect(screen.getByText('Trigger type does not have any payload')).to.exist;
    });

    it('loads the latest instances of the shown trigger type', async () => {
      renderPanel('/triggers/core.st2.CronTimer');
      await screen.findByTestId('details');

      await waitFor(() => expect(mock.history.get.some(({ url }) => url === `${URL}/triggerinstances`)).to.be.true);
      const requests = () => mock.history.get.filter(({ url }) => url === `${URL}/triggerinstances`);
      expect(requests().map(({ params }) => params)).to.deep.equal([{ trigger_type: 'core.st2.CronTimer', limit: 10 }]);

      fireEvent.click(screen.getByTestId('trigger trigger:core.st2.webhook'));

      await waitFor(() => expect(requests()).to.have.length(2));
      expect(requests()[1].params).to.deep.equal({ trigger_type: 'core.st2.webhook', limit: 10 });
    });

    it('switches to the instances and code sections', async () => {
      renderPanel('/triggers/core.st2.CronTimer');
      await screen.findByTestId('details');

      fireEvent.click(screen.getByTestId('switch:instances'));

      expect(pathname()).to.equal('/triggers/core.st2.CronTimer/instances');
      const instances = await screen.findByTestId('trigger_instances');
      await waitFor(() => expect(instances.textContent).to.contain('inst1'));
      expect(screen.getByTestId('switch:instances').classList.contains('st2-details__switch-item--active')).to.be.true;
      expect(screen.queryByRole('heading', { name: 'Parameters' })).to.be.null;

      fireEvent.click(screen.getByTestId('switch:code'));

      expect(pathname()).to.equal('/triggers/core.st2.CronTimer/code');
      const code = await screen.findByTestId('trigger_code');
      expect(code.querySelector('code').textContent).to.contain('"ref": "core.st2.CronTimer"');
      expect(within(code).getByRole('link').getAttribute('href')).to.equal('#/code/trigger_type/core.st2.CronTimer');

      fireEvent.click(screen.getByTestId('switch:general'));
      expect(pathname()).to.equal('/triggers/core.st2.CronTimer');
    });

    it('disables the sensor when it is switched off', async () => {
      mock.onPut(`${URL}/sensortypes/core.TimersSensor`).reply(200, { ...SENSORS[0], enabled: false });
      renderPanel('/triggers/core.st2.CronTimer');
      await waitFor(() => expect(screen.getByTestId('status').textContent).to.equal('Enabled'));

      fireEvent.click(within(detailsPanel('Sensor')).getByRole('checkbox'));

      await waitFor(() => expect(screen.getByTestId('status').textContent).to.equal('Disabled'));
      expect(JSON.parse(mock.history.put[0].data)).to.deep.equal({ ...SENSORS[0], enabled: false });
      expect(within(detailsPanel('Sensor')).getByRole('checkbox').checked).to.be.false;
      expect(screen.getByTestId('trigger trigger:core.st2.CronTimer').textContent).to.contain('Disabled');
    });

    it('keeps the sensor as it was when switching it fails', async () => {
      mock.onPut(`${URL}/sensortypes/core.TimersSensor`).reply(500, { faultstring: 'boom' });
      renderPanel('/triggers/core.st2.CronTimer');
      await waitFor(() => expect(screen.getByTestId('status').textContent).to.equal('Enabled'));

      fireEvent.click(within(detailsPanel('Sensor')).getByRole('checkbox'));

      await waitFor(() => expect(mock.history.put).to.have.length(1));
      await waitFor(() => expect(store.getState().sensors['core.st2.CronTimer'].enabled).to.be.true);
      expect(screen.getByTestId('status').textContent).to.equal('Enabled');
      expect(within(detailsPanel('Sensor')).getByRole('checkbox').checked).to.be.true;
    });
  });
});

describe('Triggers', () => {
  let mock;

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onGet(`${URL}/triggertypes`).reply(200, TRIGGERS);
    mock.onGet(`${URL}/sensortypes`).reply(200, SENSORS);
    mock.onGet(`${URL}/triggerinstances`).reply(200, []);
    mock.onGet(`${URL}/packs`).reply(200, []);
  });
  afterEach(() => {
    mock.restore();
    // the menu installs idle-logout handlers on window; don't let them outlive the test
    window.onload = window.onmousemove = window.onmousedown = null;
    window.ontouchstart = window.onclick = window.onkeydown = null;
  });

  it('renders the menu and the triggers panel on its own route', async () => {
    router.push({ pathname: '/triggers/linux.file_watch.line' });
    const routes = [{ title: 'Triggers', url: '/triggers', icon: 'icon-plug', position: 2 }];

    render(
      <Provider store={rootStore}>
        <Triggers routes={routes} />
      </Provider>
    );

    await waitFor(() => expect(headerName()).to.equal('linux.file_watch.line'));
    expect(document.querySelector('header')).to.exist;
    expect(screen.getByTestId('triggers_panel')).to.exist;
  });

  it('renders nothing for other apps', () => {
    router.push({ pathname: '/rules' });

    const { container } = render(
      <Provider store={rootStore}>
        <Triggers routes={[]} />
      </Provider>
    );

    expect(container.innerHTML).to.equal('');
  });
});
