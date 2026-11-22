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

import ActionsDetails from '../actions-details.component';
import store from '../store';

const API = 'https://example.com/api/v1';

const ACTION = {
  id: 'action-1',
  ref: 'core.local',
  pack: 'core',
  name: 'local',
  description: 'Run a command',
  runner_type: 'local-shell-cmd',
  parameters: {
    cmd: { type: 'string', position: 0 },
    timeout: { type: 'integer', position: 1 },
  },
};

const GROUPS = [
  { pack: 'core', actions: [ ACTION ] },
  { pack: 'linux', actions: [] },
];

const execution = (id, start_timestamp, action = ACTION) => ({
  id,
  start_timestamp,
  status: 'succeeded',
  action: { id: action.id, ref: action.ref },
  runner: { name: 'local-shell-cmd' },
  result: { stdout: `output of ${id}` },
});

// Stands in for the execution stream; `emit` delivers an event the way EventSource would.
class FakeEventSource {
  static instance = null;

  constructor() {
    this.listeners = {};
    FakeEventSource.instance = this;
  }

  addEventListener(name, listener) {
    this.listeners[name] = [ ...this.listeners[name] || [], listener ];
  }

  removeEventListener(name, listener) {
    this.listeners[name] = (this.listeners[name] || []).filter(l => l !== listener);
  }

  emit(name, record) {
    (this.listeners[name] || []).forEach(listener => listener({ data: JSON.stringify(record) }));
  }
}

const byTest = (name) => document.querySelector(`[data-test="${name}"]`);
const field = (name) => document.querySelector(`.st2-auto-form__field[data-test="field:${name}"]`);

describe('actions details', () => {
  let mock;
  let EventSource;
  let props;

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
    mock.onGet(`${API}/actions/views/overview/core.local`).reply(200, ACTION);
    mock.onGet(`${API}/actions/views/entry_point/core.local`).reply(200, 'echo "$1"', { 'content-type': 'text/plain' });
    mock.onGet(`${API}/executions`).reply(200, [ execution('e2', '2026-01-02T00:00:00Z'), execution('e1', '2026-01-01T00:00:00Z') ]);
    mock.onGet(`${API}/actions`).reply(200, [ ACTION ]);

    sinon.stub(notification, 'success');
    sinon.stub(notification, 'error');

    store.dispatch({ type: 'FETCH_ACTION', status: 'success', payload: undefined });
    store.dispatch({ type: 'FETCH_EXECUTIONS', status: 'success', payload: [] });
    store.dispatch({ type: 'FETCH_ENTRYPOINT', status: 'success', payload: '' });

    props = {
      id: 'core.local',
      section: 'general',
      groups: GROUPS,
      filter: '',
      handleNavigate: sinon.spy(),
      handleRun: sinon.spy(),
      handleDelete: sinon.spy(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  async function renderDetails(overrides = {}) {
    let result;
    await act(async () => {
      result = render(
        <Provider store={store}>
          <ActionsDetails {...props} {...overrides} />
        </Provider>
      );
    });
    await waitFor(() => expect(store.getState().entrypoint).to.equal('echo "$1"'));
    return result;
  }

  it('renders nothing until the action is loaded', async () => {
    mock.onGet(`${API}/actions/views/overview/core.local`).reply(() => new Promise(() => {}));

    const { container } = await renderDetails();

    // the history and entrypoint arrived, the action itself did not
    expect(container.innerHTML).to.equal('');
  });

  it('shows the action and its parameters', async () => {
    await renderDetails();

    expect(byTest('header_name').textContent).to.equal('core.local');
    expect(byTest('header_name').querySelector('a').getAttribute('href')).to.equal('#/actions/core.local');
    expect(byTest('header_description').textContent).to.equal('Run a command');
    expect(field('cmd')).to.exist;
    expect(field('timeout')).to.exist;
    expect(document.title).to.equal('core.local - Actions | My App Title');
  });

  it('asks to navigate to the section that is picked', async () => {
    await renderDetails();

    fireEvent.click(byTest('switch:executions'));

    expect(props.handleNavigate.calledOnceWith({ id: 'core.local', section: 'executions' })).to.be.true;
  });

  it('fetches the action again when another one is selected', async () => {
    const { rerender } = await renderDetails();
    const other = { ...ACTION, id: 'action-2', ref: 'core.remote', name: 'remote' };
    mock.onGet(`${API}/actions/views/overview/core.remote`).reply(200, other);
    mock.onGet(`${API}/actions/views/entry_point/core.remote`).reply(200, 'ssh', { 'content-type': 'text/plain' });

    await act(async () => {
      rerender(
        <Provider store={store}>
          <ActionsDetails {...props} id="core.remote" />
        </Provider>
      );
    });

    await waitFor(() => expect(byTest('header_name').textContent).to.equal('core.remote'));
    await waitFor(() => expect(store.getState().entrypoint).to.equal('ssh'));
  });

  describe('running', () => {
    it('runs the action with the entered parameters and trace tag', async () => {
      await renderDetails();

      fireEvent.change(field('cmd'), { target: { value: 'uptime' }});
      const trace = within(byTest('action_parameters')).getAllByRole('textbox').find(input => !input.dataset.test);
      fireEvent.change(trace, { target: { value: 'my-tag' }});
      fireEvent.click(byTest('run_submit'));

      expect(props.handleRun.calledOnceWith('core.local', { cmd: 'uptime' }, 'my-tag')).to.be.true;
    });

    it('previews the parameters it would run with', async () => {
      await renderDetails();

      fireEvent.change(field('cmd'), { target: { value: 'uptime' }});
      expect(byTest('action_code')).to.be.null;

      fireEvent.click(screen.getByDisplayValue('Preview'));

      expect(JSON.parse(byTest('action_code').textContent)).to.deep.equal({ cmd: 'uptime' });
    });

    it('refuses to run with a timeout that is not a valid number of seconds', async () => {
      await renderDetails();

      for (const [ timeout, disabled ] of [
        [ 'soon', true ],
        [ '3000000', true ],
        [ '60', false ],
        [ '{{ ctx().timeout }}', false ],
      ]) {
        fireEvent.change(field('timeout'), { target: { value: timeout }});
        expect(byTest('run_submit').disabled, timeout).to.equal(disabled);
      }
    });

    it('offers the workflow editor only for workflows', async () => {
      await renderDetails();
      expect(screen.queryByText('Edit')).to.be.null;

      act(() => {
        store.dispatch({ type: 'FETCH_ACTION', status: 'success', payload: { ...ACTION, runner_type: 'orquesta' }});
      });

      await waitFor(() => expect(screen.getByText('Edit').getAttribute('href')).to.equal('#/action/core.local'));
    });
  });

  describe('code', () => {
    it('shows the action definition', async () => {
      await renderDetails({ section: 'code' });

      const code = byTest('action_code');
      expect(code.textContent).to.contain('"ref": "core.local"');
      expect(within(code).getByText('expand').getAttribute('href')).to.equal('#/code/action/core.local');
    });

    it('shows the entrypoint', async () => {
      await renderDetails({ section: 'entrypoint' });

      const code = byTest('action_entrypoint');
      expect(code.textContent).to.contain('echo "$1"');
      expect(within(code).getByText('expand').getAttribute('href')).to.equal('#/code/entrypoint/core.local');
    });
  });

  describe('executions', () => {
    const rows = () => [ ...byTest('action_executions').querySelectorAll('.st2-actions__details-column-history') ]
      .map(link => link.getAttribute('href'));

    it('lists the latest executions, linking to their history', async () => {
      await renderDetails({ section: 'executions' });

      expect(rows()).to.deep.equal([
        '#/history/e1/general?action=core.local',
        '#/history/e2/general?action=core.local',
      ]);
      expect(screen.getByText('See full action history').getAttribute('href')).to.equal('#/history?action=core.local');
    });

    it('expands an execution to show its result', async () => {
      await renderDetails({ section: 'executions' });

      expect(screen.queryByText('output of e1', { exact: false })).to.be.null;
      fireEvent.click(byTest('action_executions').querySelector('.st2-flex-table__row'));

      expect(byTest('action_executions').querySelector('.st2-flex-insert').textContent).to.contain('output of e1');
    });

    it('says so when there are none', async () => {
      mock.onGet(`${API}/executions`).reply(200, []);

      await renderDetails({ section: 'executions' });

      expect(screen.getByText('No history records for this action')).to.exist;
    });

    it('follows executions of this action on the stream', async () => {
      await renderDetails({ section: 'executions' });
      const stream = FakeEventSource.instance;

      act(() => {
        stream.emit('st2.execution__create', execution('e3', '2026-01-03T00:00:00Z'));
        stream.emit('st2.execution__create', execution('x1', '2026-01-03T00:00:00Z', { id: 'other', ref: 'core.other' }));
        stream.emit('st2.execution__update', { ...execution('e1', '2026-01-01T00:00:00Z'), status: 'failed' });
        stream.emit('st2.execution__delete', execution('e2', '2026-01-02T00:00:00Z'));
      });

      expect(rows()).to.deep.equal([
        '#/history/e1/general?action=core.local',
        '#/history/e3/general?action=core.local',
      ]);
      expect(store.getState().executions[0].status).to.equal('failed');
    });

    it('stops following the stream once closed', async () => {
      const { unmount } = await renderDetails({ section: 'executions' });
      const stream = FakeEventSource.instance;

      unmount();

      expect(Object.values(stream.listeners).flat()).to.deep.equal([]);
    });
  });

  describe('deleting', () => {
    it('asks for confirmation, then deletes with or without the files', async () => {
      await renderDetails();
      const dialog = document.getElementById('delete');

      fireEvent.click(screen.getByDisplayValue('Delete'));
      expect(dialog.style.display).to.equal('block');
      fireEvent.click(within(dialog).getByText('Close'));
      expect(dialog.style.display).to.equal('none');
      expect(props.handleDelete.called).to.be.false;

      fireEvent.click(screen.getByDisplayValue('Delete'));
      fireEvent.click(within(dialog).getByText('Submit'));
      expect(props.handleDelete.lastCall.args).to.deep.equal([ 'core.local', false ]);

      fireEvent.click(screen.getByDisplayValue('Delete'));
      fireEvent.click(document.getElementById('deletecheckbox'));
      fireEvent.click(within(dialog).getByText('Submit'));
      expect(props.handleDelete.lastCall.args).to.deep.equal([ 'core.local', true ]);
      expect(dialog.style.display).to.equal('none');
    });
  });

  describe('cloning', () => {
    const dialog = () => document.getElementById('overlay');

    async function openClone(overrides) {
      await renderDetails(overrides);
      fireEvent.click(screen.getByDisplayValue('Clone'));
      expect(dialog().style.display).to.equal('block');
    }

    it('is not offered while another action is loading', async () => {
      const { rerender } = await renderDetails();
      expect(screen.getByDisplayValue('Clone').disabled).to.be.false;
      mock.onGet(`${API}/actions/views/overview/core.other`).reply(() => new Promise(() => {}));

      await act(async () => {
        rerender(
          <Provider store={store}>
            <ActionsDetails {...props} id="core.other" />
          </Provider>
        );
      });

      expect(byTest('header_name').textContent).to.equal('core.local');
      expect(screen.getByDisplayValue('Clone').disabled).to.be.true;
    });

    it('offers every pack, even while the list is filtered', async () => {
      const { rerender } = await renderDetails();

      await act(async () => {
        rerender(
          <Provider store={store}>
            <ActionsDetails {...props} filter="local" groups={[ GROUPS[0] ]} />
          </Provider>
        );
      });

      const options = [ ...dialog().querySelectorAll('select option') ].map(option => option.value);
      expect(options).to.deep.equal([ '', 'core', 'linux' ]);
      expect(dialog().querySelector('select').value).to.equal('core');
    });

    it('clones into the chosen pack and name', async () => {
      // the list refresh after a clone reads URL params the details are never given
      await openClone({ match: { params: {}}});
      mock.onPost(`${API}/actions/core.local/clone`).reply(201, { ref: 'linux.copy' });

      fireEvent.change(dialog().querySelector('select'), { target: { value: 'linux' }});
      fireEvent.change(dialog().querySelector('textarea'), { target: { value: 'copy' }});
      fireEvent.click(document.getElementById('checkbox'));
      await act(async () => {
        fireEvent.click(within(dialog()).getByText('Submit'));
      });

      await waitFor(() => expect(notification.success.calledWith('Action "local" has been cloned successfully.')).to.be.true);
      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({
        dest_pack: 'linux',
        dest_action: 'copy',
        overwrite: true,
      });
      expect(dialog().style.display).to.equal('none');
      // and the action list is fetched again
      await waitFor(() => expect(mock.history.get.some(({ url }) => url === `${API}/actions`)).to.be.true);
    });

    it('shows why a clone was refused, in the dialog', async () => {
      await openClone();
      mock.onPost(`${API}/actions/core.local/clone`).reply(409, { faultstring: 'Action already exists' });

      fireEvent.change(dialog().querySelector('textarea'), { target: { value: 'local' }});
      await act(async () => {
        fireEvent.click(within(dialog()).getByText('Submit'));
      });

      await waitFor(() => expect(document.getElementById('error').textContent).to.equal('Action already exists'));
      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({
        dest_pack: 'core',
        dest_action: 'local',
        overwrite: false,
      });
      expect(dialog().style.display).to.equal('block');

      // editing the name clears the message
      fireEvent.change(dialog().querySelector('textarea'), { target: { value: 'local2' }});
      expect(document.getElementById('error').textContent).to.equal('');
    });
  });
});
