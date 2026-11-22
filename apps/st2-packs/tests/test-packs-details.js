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

import store from '../store';
import apiPacks from '../api';
import PacksDetails from '../packs-details.component';

// st2web marks elements with data-test
configure({ testIdAttribute: 'data-test' });

const URL = 'https://example.com/api/v1';

const INSTALLED = [
  {
    ref: 'core',
    name: 'Core',
    description: 'Basic core actions.',
    version: '3.9.0',
    author: 'StackStorm, Inc.',
    email: 'info@stackstorm.com',
    keywords: [ 'linux', 'utils' ],
    repo_url: 'https://github.com/StackStorm/st2',
    files: [ 'actions/local.yaml', 'actions/remote.yaml', 'rules/notify.yaml' ],
  },
];

const INDEX = {
  aws: { ref: 'aws', name: 'AWS', description: 'Amazon Web Services', version: '1.0.0', author: 'Someone', content: { actions: { count: 3 }}},
};

describe('PacksDetails', () => {
  let mock;
  let handlers;

  beforeAll(async () => {
    await api.connect();
    mock = new MockAdapter(axios);
    mock.onGet(`${URL}/packs`).reply(200, INSTALLED);
    mock.onGet(`${URL}/packs/index`).reply(200, { index: INDEX });
    mock.onGet(`${URL}/config_schemas`).reply(200, [
      { pack: 'core', attributes: { region: { type: 'string' }, retries: { type: 'integer' }}},
    ]);
    mock.onGet(`${URL}/configs`).reply(200, [
      { pack: 'core', values: { region: 'us-east-1' }},
    ]);
  });
  afterAll(() => {
    mock.restore();
    api.disconnect();
  });

  beforeEach(async () => {
    // the details look packs up in the list the api module keeps from its last listing
    const packs = await apiPacks.list();
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: packs });
    store.dispatch({ type: 'FETCH_PACK', status: 'success', payload: undefined });

    handlers = {
      handleInstall: sinon.spy(),
      handleRemove: sinon.spy(),
      handleSave: sinon.spy(),
      handleFilterChange: sinon.spy(),
    };
    sinon.stub(notification, 'error');
  });
  afterEach(() => {
    sinon.restore();
  });

  async function renderDetails(id) {
    const view = render(
      <Provider store={store}>
        <PacksDetails id={id} section="general" {...handlers} />
      </Provider>
    );
    await screen.findByTestId('details');
    return view;
  }

  const infoLines = () => [ ...screen.getByTestId('pack_info').querySelectorAll('dl') ]
    .map((line) => [ line.querySelector('dt').textContent, line.querySelector('dd').textContent ]);

  it('shows the pack header, metadata, content and config', async () => {
    await renderDetails('core');

    const header = screen.getByTestId('header_name');
    expect(within(header).getByRole('link').getAttribute('href')).to.equal('#/packs/core');
    expect(header.textContent).to.equal('Core');
    expect(screen.getByTestId('header_description').textContent).to.equal('Basic core actions.');

    expect(infoLines()).to.deep.equal([
      [ 'version', '3.9.0' ],
      [ 'author', 'StackStorm, Inc.' ],
      [ 'email', 'info@stackstorm.com' ],
      [ 'keywords', 'linuxutils' ],
      [ 'Repo URL', 'https://github.com/StackStorm/st2' ],
    ]);
    expect(screen.getByText('info@stackstorm.com').getAttribute('href')).to.equal('mailto:info@stackstorm.com');
    expect(screen.getByText('https://github.com/StackStorm/st2').getAttribute('href'))
      .to.equal('https://github.com/StackStorm/st2');

    expect(screen.getByTestId('pack_content').textContent).to.contain('actions: 2').and.contain('rules: 1');

    const config = screen.getByTestId('pack_config');
    expect(config.querySelector('[data-test="field:region"]').value).to.equal('us-east-1');
    expect(config.querySelector('[data-test="field:retries"]')).to.exist;

    expect(screen.getByDisplayValue('Remove')).to.exist;
    expect(screen.queryByDisplayValue('Install')).to.be.null;
    expect(document.title).to.contain('Core - Packs');
  });

  it('filters the panel by a keyword when it is clicked', async () => {
    await renderDetails('core');

    fireEvent.click(screen.getByText('utils'));

    expect(handlers.handleFilterChange.calledOnceWith('utils')).to.be.true;
  });

  it('removes an installed pack and installs an available one', async () => {
    const view = await renderDetails('core');
    fireEvent.click(screen.getByDisplayValue('Remove'));
    expect(handlers.handleRemove.calledOnceWith('core')).to.be.true;

    view.rerender(
      <Provider store={store}>
        <PacksDetails id="aws" section="general" {...handlers} />
      </Provider>
    );
    await screen.findByText('AWS');

    // an index-only pack has no config to edit
    expect(screen.queryByTestId('pack_config')).to.be.null;
    expect(screen.queryByDisplayValue('Remove')).to.be.null;
    fireEvent.click(screen.getByDisplayValue('Install'));
    expect(handlers.handleInstall.calledOnceWith('aws')).to.be.true;
  });

  it('disables the buttons while a pack is being installed or removed', async () => {
    await renderDetails('aws');

    act(() => {
      store.dispatch({ type: 'INSTALL_PACK', ref: 'aws' });
    });
    expect(screen.getByDisplayValue('Install').disabled).to.be.true;

    act(() => {
      store.dispatch({ type: 'INSTALL_PACK', ref: 'aws', status: 'success' });
      store.dispatch({ type: 'UNINSTALL_PACK', ref: 'aws' });
    });
    expect(screen.getByDisplayValue('Remove').disabled).to.be.true;
  });

  it('saves the edited config and previews it', async () => {
    await renderDetails('core');
    const config = screen.getByTestId('pack_config');

    fireEvent.change(config.querySelector('[data-test="field:region"]'), { target: { value: 'eu-west-1' }});

    fireEvent.click(within(config).getByDisplayValue('Preview'));
    await waitFor(() => expect(config.querySelector('code').textContent).to.contain('eu-west-1'));

    fireEvent.click(within(config).getByDisplayValue('Save'));
    expect(handlers.handleSave.calledOnce).to.be.true;
    expect(handlers.handleSave.firstCall.args).to.deep.equal([ 'core', { region: 'eu-west-1' }]);
  });

  it('shows an error and nothing else for a pack that does not exist', async () => {
    render(
      <Provider store={store}>
        <PacksDetails id="missing" section="general" {...handlers} />
      </Provider>
    );

    await waitFor(() => expect(notification.error.calledOnce).to.be.true);
    expect(notification.error.firstCall.args[0]).to.equal('Unable to retrieve pack "missing".');
    expect(notification.error.firstCall.args[1].err).to.include({ status: 404 });
    expect(screen.queryByTestId('details')).to.be.null;
  });
});
