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
import { render, screen, fireEvent, within, waitFor, act, configure } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import rootStore from '@stackstorm/module-store';
import router, { Route } from '@stackstorm/module-router';

import store from '../store';
import Packs from '../packs.component';
import PacksPanel from '../packs-panel.component';

// st2web marks elements with data-test
configure({ testIdAttribute: 'data-test' });

const URL = 'https://example.com/api/v1';

const INSTALLED = [
  { ref: 'core', name: 'core', description: 'Core actions', version: '3.9.0', files: []},
  { ref: 'linux', name: 'linux', description: 'Linux actions', version: '1.0.0', files: []},
];

const INDEX = {
  core: { ref: 'core', name: 'core', version: '3.9.0', content: {}},
  aws: { ref: 'aws', name: 'aws', description: 'Amazon Web Services', version: '1.0.0', content: {}},
  zabbix: { ref: 'zabbix', name: 'zabbix', description: 'Zabbix monitoring', version: '0.1.0', content: {}},
};

// The details panel and the app shell take the current location from the root store.
function renderPanel(pathname) {
  router.push({ pathname });

  return render(
    <Provider store={rootStore}>
      <Route
        path='/packs/:ref?/:section?'
        render={({ match, location }) => (
          <Provider store={store}>
            <PacksPanel match={match} location={location} />
          </Provider>
        )}
      />
    </Provider>
  );
}

const pathname = () => rootStore.getState().location.pathname;
const cards = () => screen.queryAllByTestId(/^pack pack:/).map((card) => card.getAttribute('data-test').slice(10));
const groupTitles = () => [ ...document.querySelectorAll('.st2-flex-table__caption-title') ].map((el) => el.textContent);
const headerName = () => screen.getByTestId('header_name').textContent;

describe('PacksPanel', () => {
  let mock;
  let source;

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(() => {
    // start from an empty store, so the details wait for this test's listing
    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [] });
    store.dispatch({ type: 'FETCH_PACK', status: 'success', payload: undefined });

    mock = new MockAdapter(axios);
    mock.onGet(`${URL}/packs`).reply(200, INSTALLED);
    mock.onGet(`${URL}/packs/index`).reply(200, { index: INDEX });
    mock.onGet(`${URL}/config_schemas`).reply(200, [
      { pack: 'core', attributes: { region: { type: 'string' }}},
    ]);
    mock.onGet(`${URL}/configs`).reply(200, [
      { pack: 'core', values: { region: 'us-east-1' }},
    ]);

    // api.wait listens on the shared event stream; hand it a stream the test can emit on
    source = new EventTarget();
    sinon.spy(source, 'addEventListener');
    sinon.stub(api, 'listen').resolves(source);
    sinon.stub(notification, 'success');
    sinon.stub(notification, 'error');
  });
  afterEach(() => {
    mock.restore();
    sinon.restore();
  });

  // Report an execution update on the stream, once the panel is waiting for one.
  async function emitExecution(record) {
    await waitFor(() => expect(source.addEventListener.calledWith('st2.execution__update')).to.be.true);
    act(() => {
      const event = new Event('st2.execution__update');
      event.data = JSON.stringify(record);
      source.dispatchEvent(event);
    });
  }

  it('lists packs grouped by status and shows the first one', async () => {
    renderPanel('/packs');

    await screen.findByTestId('details');

    expect(groupTitles()).to.deep.equal([ 'installed', 'available' ]);
    expect(cards()).to.deep.equal([ 'core', 'linux', 'aws', 'zabbix' ]);
    expect(screen.getByTestId('pack pack:core').classList.contains('st2-flex-card--active')).to.be.true;
    expect(headerName()).to.equal('core');
  });

  it('shows the pack named in the url', async () => {
    renderPanel('/packs/zabbix');

    await waitFor(() => expect(headerName()).to.equal('zabbix'));
    expect(screen.getByTestId('pack pack:zabbix').classList.contains('st2-flex-card--active')).to.be.true;
    expect(screen.getByTestId('header_description').textContent).to.equal('Zabbix monitoring');
  });

  it('drops a pack from the url that does not exist', async () => {
    renderPanel('/packs/missing');

    await waitFor(() => expect(pathname()).to.equal('/packs'));
  });

  it('narrows the list as the filter is typed and shows an empty state', async () => {
    renderPanel('/packs');
    await screen.findByTestId('details');

    fireEvent.change(screen.getByTestId('filter'), { target: { value: 'LI' }});
    expect(cards()).to.deep.equal([ 'linux' ]);
    expect(groupTitles()).to.deep.equal([ 'installed' ]);

    fireEvent.change(screen.getByTestId('filter'), { target: { value: 'nothing' }});
    expect(cards()).to.deep.equal([]);
    expect(screen.getByText('No results were found for your current filter.')).to.exist;
    expect(screen.queryByTestId('details')).to.be.null;
  });

  it('navigates to a pack when its card is clicked', async () => {
    renderPanel('/packs');
    await screen.findByTestId('details');

    fireEvent.click(screen.getByTestId('pack pack:aws'));

    expect(pathname()).to.equal('/packs/aws');
    await waitFor(() => expect(headerName()).to.equal('aws'));
    expect(screen.getByTestId('pack pack:aws').classList.contains('st2-flex-card--active')).to.be.true;
  });

  it('collapses and expands every group', async () => {
    renderPanel('/packs');
    await screen.findByTestId('details');

    fireEvent.click(screen.getByTestId('toggle-all'));
    expect(cards()).to.deep.equal([]);

    fireEvent.click(screen.getByTestId('toggle-all'));
    expect(cards()).to.have.length(4);
  });

  describe('install', () => {
    it('installs a pack and waits for the execution to succeed', async () => {
      mock.onPost(`${URL}/packs/install`).reply(200, { execution_id: 'ex1' });
      renderPanel('/packs/aws');
      await waitFor(() => expect(headerName()).to.equal('aws'));

      fireEvent.click(screen.getByDisplayValue('Install'));

      await waitFor(() => expect(screen.getByDisplayValue('Install').disabled).to.be.true);
      expect(groupTitles()).to.deep.equal([ 'installed', 'installing', 'available' ]);
      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({ packs: [ 'aws' ]});
      await waitFor(() => expect(notification.success.calledWith('Pack "aws" has been scheduled for installation.', { execution_id: 'ex1' })).to.be.true);

      // updates of other executions are ignored
      await emitExecution({ id: 'other', status: 'succeeded' });
      await emitExecution({ id: 'ex1', status: 'running' });
      expect(screen.getByDisplayValue('Install').disabled).to.be.true;

      await emitExecution({ id: 'ex1', status: 'succeeded' });

      await screen.findByDisplayValue('Remove');
      expect(notification.success.calledWith('Pack "aws" has been successfully installed.')).to.be.true;
      expect(notification.error.called).to.be.false;
      expect(groupTitles()).to.deep.equal([ 'installed', 'available' ]);
      expect(cards()).to.deep.equal([ 'aws', 'core', 'linux', 'zabbix' ]);
    });

    it('reports a failed installation and puts the pack back', async () => {
      mock.onPost(`${URL}/packs/install`).reply(200, { execution_id: 'ex2' });
      renderPanel('/packs/aws');
      await waitFor(() => expect(headerName()).to.equal('aws'));

      fireEvent.click(screen.getByDisplayValue('Install'));
      await emitExecution({ id: 'ex2', status: 'failed' });

      await waitFor(() => expect(notification.error.calledOnce).to.be.true);
      const [ message, { err, execution_id }] = notification.error.firstCall.args;
      expect(message).to.equal('Unable to schedule pack "aws" for installation.');
      expect(err).to.deep.equal({ id: 'ex2', status: 'failed' });
      expect(execution_id).to.equal('ex2');
      await waitFor(() => expect(screen.getByDisplayValue('Install').disabled).to.be.false);
    });

    it('reports a request that could not be scheduled', async () => {
      mock.onPost(`${URL}/packs/install`).reply(500, { faultstring: 'boom' });
      renderPanel('/packs/aws');
      await waitFor(() => expect(headerName()).to.equal('aws'));

      fireEvent.click(screen.getByDisplayValue('Install'));

      await waitFor(() => expect(notification.error.calledOnce).to.be.true);
      expect(notification.error.firstCall.args[0]).to.equal('Unable to schedule pack "aws" for installation.');
      expect(notification.success.called).to.be.false;
      expect(api.listen.called).to.be.false;
      await waitFor(() => expect(screen.getByDisplayValue('Install').disabled).to.be.false);
    });
  });

  describe('remove', () => {
    it('removes a pack and waits for the execution to succeed', async () => {
      mock.onPost(`${URL}/packs/uninstall`).reply(200, { execution_id: 'ex3' });
      renderPanel('/packs/linux');
      await waitFor(() => expect(headerName()).to.equal('linux'));

      fireEvent.click(screen.getByDisplayValue('Remove'));

      await waitFor(() => expect(screen.getByDisplayValue('Remove').disabled).to.be.true);
      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({ packs: [ 'linux' ]});
      await emitExecution({ id: 'ex3', status: 'succeeded' });

      await screen.findByDisplayValue('Install');
      expect(notification.success.calledWith('Pack "linux" has been scheduled for removal.', { execution_id: 'ex3' })).to.be.true;
      expect(notification.success.calledWith('Pack "linux" has been successfully removed.')).to.be.true;
      expect(cards()).to.deep.equal([ 'core', 'aws', 'linux', 'zabbix' ]);
    });

    it('reports a failed removal and keeps the pack installed', async () => {
      mock.onPost(`${URL}/packs/uninstall`).reply(200, { execution_id: 'ex4' });
      renderPanel('/packs/linux');
      await waitFor(() => expect(headerName()).to.equal('linux'));

      fireEvent.click(screen.getByDisplayValue('Remove'));
      await emitExecution({ id: 'ex4', status: 'failed' });

      await waitFor(() => expect(notification.error.calledOnce).to.be.true);
      expect(notification.error.firstCall.args[0]).to.equal('Unable to schedule pack "linux" for removal.');
      await waitFor(() => expect(screen.getByDisplayValue('Remove').disabled).to.be.false);
    });
  });

  describe('save config', () => {
    async function editRegion() {
      renderPanel('/packs/core');
      const config = await screen.findByTestId('pack_config');

      fireEvent.change(config.querySelector('[data-test="field:region"]'), { target: { value: 'eu-west-1' }});
      fireEvent.click(within(config).getByDisplayValue('Save'));
    }

    it('puts the edited config to the API', async () => {
      mock.onPut(`${URL}/configs/core`).reply(200, { region: 'eu-west-1' });

      await editRegion();

      await waitFor(() => expect(notification.success.calledOnce).to.be.true);
      expect(notification.success.firstCall.args[0]).to.equal('Configuration for pack "core" has been saved succesfully.');
      const [ request ] = mock.history.put;
      expect(JSON.parse(request.data)).to.deep.equal({ region: 'eu-west-1' });
      expect(request.params).to.deep.equal({ show_secrets: true });
    });

    it('reports a config that could not be saved', async () => {
      mock.onPut(`${URL}/configs/core`).reply(400, { faultstring: 'invalid' });

      await editRegion();

      await waitFor(() => expect(notification.error.calledOnce).to.be.true);
      expect(notification.error.firstCall.args[0]).to.equal('Unable to save the configuration for pack "core".');
      expect(notification.success.called).to.be.false;
    });
  });
});

describe('Packs', () => {
  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  let mock;
  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onGet(`${URL}/packs`).reply(200, INSTALLED);
    mock.onGet(`${URL}/packs/index`).reply(200, { index: {}});
    mock.onGet(`${URL}/config_schemas`).reply(200, []);
    mock.onGet(`${URL}/configs`).reply(200, []);
  });
  afterEach(() => {
    mock.restore();
    // the menu installs idle-logout handlers on window; don't let them outlive the test
    window.onload = window.onmousemove = window.onmousedown = null;
    window.ontouchstart = window.onclick = window.onkeydown = null;
  });

  it('renders the menu and the packs panel on its own route', async () => {
    router.push({ pathname: '/packs/linux' });
    const routes = [{ title: 'Packs', url: '/packs', icon: 'icon-platforms', position: 4 }];

    render(
      <Provider store={rootStore}>
        <Packs routes={routes} />
      </Provider>
    );

    await waitFor(() => expect(headerName()).to.equal('linux'));
    expect(document.querySelector('header')).to.exist;
    expect(screen.getByTestId('packs_panel')).to.exist;
    expect(document.title).to.contain('Packs');
  });

  it('renders nothing for other apps', () => {
    router.push({ pathname: '/actions' });

    const { container } = render(
      <Provider store={rootStore}>
        <Packs routes={[]} />
      </Provider>
    );

    expect(container.innerHTML).to.equal('');
  });
});
