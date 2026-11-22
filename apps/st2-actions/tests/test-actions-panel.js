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
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import rootStore from '@stackstorm/module-store';
import router from '@stackstorm/module-router/methods';

import Actions from '../actions.component';
import store from '../store';

const API = 'https://example.com/api/v1';

const ACTIONS = [
  { ref: 'core.local', pack: 'core', name: 'local', description: 'Run a command', runner_type: 'local-shell-cmd' },
  { ref: 'core.http', pack: 'core', name: 'http', description: 'Send a request', runner_type: 'http-request' },
  { ref: 'linux.wait', pack: 'linux', name: 'wait', description: 'Wait a bit', runner_type: 'local-shell-cmd' },
];

const overview = (ref) => {
  const action = ACTIONS.find(action => action.ref === ref);
  return action && {
    ...action,
    id: `id-${ref}`,
    parameters: { cmd: { type: 'string' }},
  };
};

// ActionsDetails subscribes to the execution stream on mount; jsdom has no EventSource.
class FakeEventSource {
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

const location = () => rootStore.getState().location.pathname;
const pack = (name) => screen.getByText(name, { selector: '.st2-flex-table__caption-title' }).closest('.st2-flex-table');
const card = (ref) => document.querySelector(`[data-test="action action:${ref}"]`);
const byTest = (name) => document.querySelector(`[data-test="${name}"]`);
const header = () => document.querySelector('[data-test="details"] [data-test="header_name"]');

describe('actions panel', () => {
  let mock;
  let EventSource;

  beforeAll(async () => {
    EventSource = globalThis.EventSource;
    globalThis.EventSource = FakeEventSource;

    mock = new MockAdapter(axios);
    await api.connect();
  });

  afterAll(() => {
    mock.restore();
    api.disconnect();
    globalThis.EventSource = EventSource;
  });

  beforeEach(() => {
    mock.reset();
    mock.onGet(`${API}/packs`).reply(200, []);
    mock.onGet(`${API}/actions`).reply(200, ACTIONS);
    mock.onGet(new RegExp(`^${API}/actions/views/overview/`)).reply(({ url }) => {
      const action = overview(url.split('/').pop());
      return action ? [ 200, action ] : [ 404, { faultstring: 'not found' }];
    });
    mock.onGet(new RegExp(`^${API}/actions/views/entry_point/`))
      .reply(({ url }) => [ 200, `source of ${url.split('/').pop()}`, { 'content-type': 'text/plain' }]);
    mock.onGet(`${API}/executions`).reply(200, []);

    sinon.stub(notification, 'success');
    sinon.stub(notification, 'error');

    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [] });
    store.dispatch({ type: 'FETCH_ACTION', status: 'success', payload: undefined });
    router.push({ pathname: '/actions' });
  });

  afterEach(() => {
    sinon.restore();
  });

  async function renderActions() {
    await act(async () => {
      render(
        <Provider store={rootStore}>
          <Actions routes={[]} />
        </Provider>
      );
    });
  }

  // waits for the details of `ref` to be fetched and shown
  const detailsOf = (ref) => waitFor(() => {
    expect(header().textContent).to.equal(ref);
    expect(store.getState().entrypoint).to.equal(`source of ${ref}`);
  });

  it('lists actions by pack and shows the first one', async () => {
    await renderActions();
    await detailsOf('core.http');

    const [ request ] = mock.history.get.filter(({ url }) => url === `${API}/actions`);
    expect(request.params).to.deep.equal({ include_attributes: 'ref,pack,name,description,runner_type' });

    // packs start collapsed; opening one shows its actions in ref order
    expect(card('core.http')).to.be.null;
    fireEvent.click(within(pack('core')).getByText('core'));

    const cards = pack('core').querySelectorAll('.st2-flex-card');
    expect([ ...cards ].map(card => card.dataset.test)).to.deep.equal([ 'action action:core.http', 'action action:core.local' ]);
    expect(within(card('core.local')).getByText('local').title).to.equal('core.local');
    expect(within(card('core.local')).getByText('Run a command')).to.exist;
    expect(card('core.http').classList.contains('st2-flex-card--active')).to.be.true;
    expect(card('linux.wait')).to.be.null;
  });

  it('expands and collapses every pack at once', async () => {
    await renderActions();
    await detailsOf('core.http');

    fireEvent.click(byTest('toggle-all'));
    expect(card('core.local')).to.exist;
    expect(card('linux.wait')).to.exist;

    fireEvent.click(byTest('toggle-all'));
    expect(card('core.local')).to.be.null;
    expect(card('linux.wait')).to.be.null;
  });

  it('narrows the list with the filter', async () => {
    await renderActions();
    await detailsOf('core.http');

    fireEvent.change(byTest('filter'), { target: { value: 'WAIT' }});

    expect(screen.queryByText('core', { selector: '.st2-flex-table__caption-title' })).to.be.null;
    expect(pack('linux')).to.exist;
    // the first action left in the list is shown
    await detailsOf('linux.wait');

    fireEvent.change(byTest('filter'), { target: { value: 'nothing' }});
    expect(screen.getByText('No results were found for your current filter.')).to.exist;
  });

  it('opens the action that is clicked', async () => {
    await renderActions();
    await detailsOf('core.http');

    fireEvent.click(byTest('toggle-all'));
    await act(async () => {
      fireEvent.click(card('linux.wait'));
    });

    expect(location()).to.equal('/actions/linux.wait');
    await detailsOf('linux.wait');
    expect(card('linux.wait').classList.contains('st2-flex-card--active')).to.be.true;

    const history = mock.history.get.filter(({ url }) => url === `${API}/executions`).pop();
    expect(history.params).to.deep.equal({
      action: 'linux.wait',
      limit: 5,
      exclude_attributes: 'trigger_instance',
      parent: 'null',
    });
  });

  it('leaves the URL of an action that does not exist', async () => {
    router.push({ pathname: '/actions/core.missing' });

    await renderActions();

    await waitFor(() => expect(location()).to.equal('/actions'));
    await detailsOf('core.http');
  });

  it('reports a failure to load the list', async () => {
    mock.onGet(`${API}/actions`).reply(500, { faultstring: 'Internal error' });

    await renderActions();

    await waitFor(() => expect(notification.error.calledWith('Unable to retrieve actions.')).to.be.true);
    expect(document.querySelector('.st2-flex-table')).to.be.null;
  });

  describe('running', () => {
    async function run() {
      await renderActions();
      await detailsOf('core.http');

      fireEvent.change(document.querySelector('.st2-auto-form__field[data-test="field:cmd"]'), { target: { value: 'uptime' }});
      await act(async () => {
        fireEvent.click(byTest('run_submit'));
      });
    }

    it('schedules an execution with the entered parameters', async () => {
      mock.onPost(`${API}/executions`).reply(201, { id: 'exec-1' });

      await run();

      await waitFor(() => expect(notification.success.called).to.be.true);
      const [ request ] = mock.history.post;
      expect(JSON.parse(request.data)).to.deep.equal({
        action: 'core.http',
        parameters: { cmd: 'uptime' },
        context: { trace_context: {}},
      });
      expect(notification.success.firstCall.args).to.deep.equal([
        'Action "core.http" has been scheduled successfully.',
        { execution_id: 'exec-1' },
      ]);
    });

    it('reports an execution that could not be scheduled', async () => {
      mock.onPost(`${API}/executions`).reply(400, { faultstring: 'bad parameters' });

      await run();

      await waitFor(() => expect(notification.error.called).to.be.true);
      expect(notification.error.firstCall.args[0]).to.equal('Unable to schedule action "core.http".');
      expect(notification.success.called).to.be.false;
    });
  });

  describe('deleting', () => {
    async function remove({ removeFiles }) {
      await renderActions();
      await detailsOf('core.http');

      fireEvent.click(screen.getByDisplayValue('Delete'));
      const dialog = document.getElementById('delete');
      expect(dialog.style.display).to.equal('block');

      if (removeFiles) {
        fireEvent.click(document.getElementById('deletecheckbox'));
      }
      await act(async () => {
        fireEvent.click(within(dialog).getByText('Submit'));
      });
      expect(dialog.style.display).to.equal('none');
    }

    it('deletes the action, its files if asked, and refreshes the list', async () => {
      mock.onDelete(`${API}/actions/core.http`).reply(() => {
        mock.onGet(`${API}/actions`).reply(200, ACTIONS.filter(({ ref }) => ref !== 'core.http'));
        return [ 204, '' ];
      });

      await remove({ removeFiles: true });

      await waitFor(() => expect(notification.success.calledWith('Action "core.http" has been deleted successfully.')).to.be.true);
      const [ request ] = mock.history.delete;
      expect(JSON.parse(request.data)).to.deep.equal({ remove_files: true });

      // the next action takes its place
      await detailsOf('core.local');
      expect(store.getState().actions.map(({ ref }) => ref)).to.deep.equal([ 'core.local', 'linux.wait' ]);
    });

    it('keeps the files unless asked, and reports failures', async () => {
      mock.onDelete(`${API}/actions/core.http`).reply(403, { faultstring: 'forbidden' });

      await remove({ removeFiles: false });

      await waitFor(() => expect(notification.error.called).to.be.true);
      expect(notification.error.firstCall.args[0]).to.equal('Unable to delete action "core.http".');
      expect(JSON.parse(mock.history.delete[0].data)).to.deep.equal({ remove_files: false });
      expect(store.getState().actions.map(({ ref }) => ref)).to.include('core.http');
    });
  });
});
