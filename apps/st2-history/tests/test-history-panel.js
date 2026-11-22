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
import { render, screen, fireEvent, within, act, waitFor, configure } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import rootStore from '@stackstorm/module-store';
import { Route } from '@stackstorm/module-router';
import { updateLocation } from '@stackstorm/module-router/methods';

import store from '../store';
import HistoryPanel from '../history-panel.component';

const API = 'https://example.com/api/v1';

const listed = (id, status, hour, extra) => ({
  id,
  status,
  start_timestamp: `2026-10-30T${hour}:00:00.000Z`,
  action: { ref: 'core.local', name: 'local', runner_type: 'local-shell-cmd' },
  parameters: { cmd: 'date' },
  context: { user: 'st2admin' },
  ...extra,
});

const newest = listed('e2', 'running', 14);
const older = listed('e1', 'succeeded', 12, {
  action: { ref: 'examples.orquesta-sequential', name: 'orquesta-sequential', runner_type: 'orquesta' },
  parameters: { name: 'Stanley' },
});
const child = listed('e1-1', 'succeeded', 12, { parent: 'e1', context: { user: 'st2admin', orquesta: { task_name: 'task1' }}});

// What GET /executions/:id returns for the details pane.
const full = (record, extra) => ({
  ...record,
  action: {
    ...record.action,
    description: 'Action that executes an arbitrary Linux command on the localhost.',
    parameters: { cmd: { type: 'string' }, name: { type: 'string' }},
  },
  runner: { name: 'local-shell-cmd', runner_parameters: { timeout: { type: 'integer', default: 60 }}},
  result: { stdout: 'Fri Oct 30 12:00:00 UTC 2026', stderr: '', return_code: 0, succeeded: true, failed: false },
  ...extra,
});

const detailUrl = (id) => `${API}/executions/${id}?max_result_size=102400`;

// What history.component.js renders, minus the menu: the route feeds location and match from
// the root store, the panel reads its data from the scoped store.
function renderAt(pathname, search = '') {
  updateLocation({ pathname, search, hash: '' }, 'PUSH');

  return render(
    <Provider store={rootStore}>
      <Route
        path="/history/:ref?/:section?"
        render={({ match, location }) => (
          <Provider store={store}>
            <HistoryPanel location={location} match={match} />
          </Provider>
        )}
      />
    </Provider>
  );
}

const location = () => rootStore.getState().location;

describe('HistoryPanel', () => {
  let mock;
  let source;
  let list;
  let children;

  beforeAll(async () => {
    // the app marks elements with data-test, not Testing Library's data-testid
    configure({ testIdAttribute: 'data-test' });
    await api.connect();
  });
  afterAll(() => {
    configure({ testIdAttribute: 'data-testid' });
    api.disconnect();
  });

  beforeEach(async () => {
    // stands in for the stream's EventSource
    source = new EventTarget();
    sinon.stub(api, 'listen').resolves(source);
    sinon.stub(notification, 'success');
    sinon.stub(notification, 'error');
    sessionStorage.removeItem('st2HistoryView');

    list = [ newest, older ];
    children = [ child ];
    mock = new MockAdapter(axios);
    mock.onGet(`${API}/executions/views/filters`).reply(200, {
      status: [ 'failed', 'succeeded' ],
      action: [ 'core.local', 'examples.orquesta-sequential' ],
      user: [ 'st2admin' ],
    });
    mock.onGet(`${API}/executions`).reply(({ params }) => (
      params.parent === 'null'
        ? [ 200, list, { 'x-total-count': `${list.length}`, 'x-limit': '50' }]
        : [ 200, children ]
    ));
    mock.onGet(detailUrl('e1')).reply(200, full(older, { end_timestamp: '2026-10-30T12:00:04.200Z' }));
    mock.onGet(detailUrl('e2')).reply(200, full(newest));

    // drop what earlier tests left in the shared store
    await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.resolve([]) });
    await store.dispatch({ type: 'FETCH_EXECUTION', promise: Promise.resolve(undefined) });
    store.dispatch({ type: 'UPDATE_FILTER', value: undefined });
    for (const id of Object.keys(store.getState().childExecutions)) {
      store.dispatch({ type: 'FETCH_EXECUTION_CHILDREN', id, expanded: false });
    }
  });
  afterEach(() => {
    mock.restore();
    sinon.restore();
  });

  const listRequests = () => mock.history.get.filter(({ url, params }) => url === `${API}/executions` && params.parent === 'null');
  const emit = (type, record) => act(() => {
    source.dispatchEvent(new MessageEvent(`st2.execution__${type}`, { data: JSON.stringify(record) }));
  });

  describe('list', () => {
    it('asks for top-level executions and shows them under their day', async () => {
      await act(async () => renderAt('/history'));

      await screen.findByTestId('execution execution:e2');
      const tables = document.querySelectorAll('.st2-flex-table');
      expect(tables).to.have.length(1);
      expect(tables[0].querySelector('.st2-flex-table__caption-title').textContent).to.equal('Fri, 30 Oct 2026');
      expect([ ...tables[0].querySelectorAll('.st2-flex-card') ].map(card => card.getAttribute('data-test'))).to.deep.equal([
        'execution execution:e2',
        'execution execution:e1',
      ]);

      const [ request ] = listRequests();
      expect(request.params).to.include({ parent: 'null', limit: 50, offset: 0 });
      expect(request.params.include_attributes).to.include('action.ref');
    });

    it('shows an empty state when there is no history', async () => {
      list = [];

      await act(async () => renderAt('/history'));

      await waitFor(() => expect(document.querySelector('.st2-panel__content-empty')).to.not.be.null);
      expect(screen.queryByTestId('details')).to.be.null;
    });

    it('reports a failed fetch', async () => {
      mock.onGet(`${API}/executions`).reply(500, { faultstring: 'down' });

      await act(async () => renderAt('/history'));

      await waitFor(() => expect(notification.error.calledWith('Unable to retrieve history.')).to.be.true);
    });

    it('pages through older executions', async () => {
      mock.onGet(`${API}/executions`).reply(200, list, { 'x-total-count': '120', 'x-limit': '50' });

      await act(async () => renderAt('/history/e1'));
      await screen.findByTestId('execution execution:e1');

      const newer = screen.getByDisplayValue('Newer');
      expect(newer.classList.contains('st2-forms__button-prev--disabled')).to.be.true;

      await act(async () => fireEvent.click(screen.getByDisplayValue('Older')));

      expect(location()).to.include({ pathname: '/history/e1', search: '?page=2' });
      await waitFor(() => expect(listRequests()).to.have.length(2));
      expect(listRequests()[1].params.offset).to.equal(50);
    });

    it('expands a workflow to show its children', async () => {
      await act(async () => renderAt('/history'));
      const card = await screen.findByTestId('execution execution:e1');

      await act(async () => fireEvent.click(card.querySelector('.icon-chevron_right')));

      const childCard = await screen.findByTestId('execution execution:e1-1');
      expect(childCard.textContent).to.include('task1');
      const request = mock.history.get.find(({ params }) => params && params.parent === 'e1');
      expect(request.params).to.deep.equal({ parent: 'e1', exclude_attributes: 'result,trigger_instance' });

      await act(async () => fireEvent.click(card.querySelector('.icon-chevron-down')));
      expect(screen.queryByTestId('execution execution:e1-1')).to.be.null;
    });

    it('reports children that fail to load', async () => {
      await act(async () => renderAt('/history'));
      const card = await screen.findByTestId('execution execution:e1');
      mock.onGet(`${API}/executions`).reply(500, {});

      await act(async () => fireEvent.click(card.querySelector('.icon-chevron_right')));

      await waitFor(() => expect(notification.error.calledWith('Unable to retrieve children.')).to.be.true);
      expect(card.querySelector('.icon-chevron_right')).to.not.be.null;
    });
  });

  describe('filters', () => {
    it('offers the filters with more than one value', async () => {
      await act(async () => renderAt('/history'));

      await waitFor(() => expect(document.querySelectorAll('.st2-panel__toolbar-filters > *')).to.have.length(2));
      const labels = [ ...document.querySelectorAll('.st2-panel__toolbar-filters > *') ].map(filter => filter.firstChild.textContent);
      expect(labels).to.deep.equal([ 'Status', 'Action' ]);
    });

    it('narrows the list to the chosen value', async () => {
      await act(async () => renderAt('/history'));
      await screen.findByTestId('execution execution:e2');
      list = [ older ];

      await act(async () => fireEvent.click(screen.getByText('succeeded')));

      expect(location()).to.include({ pathname: '/history', search: '?status=succeeded' });
      await waitFor(() => expect(screen.queryByTestId('execution execution:e2')).to.be.null);
      expect(screen.getByTestId('execution execution:e1')).to.exist;
      expect(listRequests()[1].params).to.include({ status: 'succeeded', offset: 0 });
    });

    it('applies a filter from the URL on load', async () => {
      await act(async () => renderAt('/history', '?action=core.local'));
      await screen.findByTestId('execution execution:e2');

      expect(listRequests()[0].params).to.include({ action: 'core.local' });
      expect(document.querySelector('.st2-panel__toolbar-filters').textContent).to.include(': core.local');
    });

    it('searches with the advanced filter once every term has a value', async () => {
      await act(async () => renderAt('/history'));
      await screen.findByTestId('execution execution:e2');
      const search = screen.getByTestId('filter');

      fireEvent.click(document.querySelector('.st2-panel__toolbar-search .icon-lens'));
      expect(search.classList.contains('st2-panel__search-bar--hidden')).to.be.false;

      await act(async () => fireEvent.change(search, { target: { value: 'status:' }}));
      expect(listRequests()).to.have.length(1);

      await act(async () => fireEvent.change(search, { target: { value: 'status:failed' }}));
      await waitFor(() => expect(listRequests()).to.have.length(2));
      expect(listRequests()[1].params.filter).to.equal('status:failed');
    });
  });

  describe('live updates', () => {
    it('follows the execution stream while mounted', async () => {
      const { unmount } = await act(async () => renderAt('/history'));
      await screen.findByTestId('execution execution:e2');

      await emit('create', listed('e3', 'scheduled', 15));
      expect(screen.getByTestId('execution execution:e3').textContent).to.include('Scheduled');

      await emit('update', listed('e3', 'failed', 15));
      expect(screen.getByTestId('execution execution:e3').textContent).to.include('Failed');

      await emit('delete', listed('e3', 'failed', 15));
      expect(screen.queryByTestId('execution execution:e3')).to.be.null;

      unmount();
      await emit('create', listed('e4', 'scheduled', 16));
      expect(store.getState().executions.map(({ id }) => id)).to.not.include('e4');
    });

    it('adds children of an expanded workflow as they start', async () => {
      await act(async () => renderAt('/history/e1'));
      const card = await screen.findByTestId('execution execution:e1');
      await act(async () => fireEvent.click(card.querySelector('.icon-chevron_right')));
      await screen.findByTestId('execution execution:e1-1');

      await emit('create', listed('e1-2', 'running', 13, { parent: 'e1', context: { orquesta: { task_name: 'task2' }}}));

      expect(screen.getByTestId('execution execution:e1-2').textContent).to.include('task2');
    });
  });

  describe('selection', () => {
    it('shows the newest execution by default', async () => {
      await act(async () => renderAt('/history'));

      const details = await screen.findByTestId('details');
      await waitFor(() => expect(within(details).getByTestId('execution_id').textContent).to.equal('e2'));
      expect(screen.getByTestId('execution execution:e2').classList.contains('st2-flex-card--active')).to.be.true;
      expect(location().pathname).to.equal('/history');
    });

    it('opens the execution that is clicked', async () => {
      await act(async () => renderAt('/history'));
      await screen.findByTestId('details');

      await act(async () => fireEvent.click(screen.getByTestId('execution execution:e1')));

      expect(location().pathname).to.equal('/history/e1');
      await waitFor(() => expect(screen.getByTestId('execution_id').textContent).to.equal('e1'));
      expect(screen.getByTestId('execution execution:e1').classList.contains('st2-flex-card--active')).to.be.true;
    });
  });

  describe('details', () => {
    it('shows the execution', async () => {
      mock.onGet(detailUrl('e1')).reply(200, full(older, {
        end_timestamp: '2026-10-30T12:00:04.200Z',
        rule: { ref: 'examples.webhook', description: 'Runs on every webhook' },
        trigger: { type: 'core.st2.webhook' },
        trigger_instance: { id: 't1', occurrence_time: '2026-10-30T11:59:59.000Z', payload: { body: { hello: 'world' }}},
        context: { trace_context: { trace_tag: 'deploy-42' }},
      }));

      await act(async () => renderAt('/history/e1'));
      const details = await screen.findByTestId('details');
      await waitFor(() => expect(within(details).getByTestId('execution_id').textContent).to.equal('e1'));

      expect(within(details).getByTestId('header_name').textContent).to.equal('examples.orquesta-sequential');
      expect(within(details).getByTestId('header_description').textContent).to.include('arbitrary Linux command');
      expect(within(details).getByTestId('status').textContent).to.equal('Succeeded');
      expect(within(details).getByTestId('start_timestamp').textContent).to.equal('Fri, 30 Oct 2026 12:00:00');
      expect(within(details).getByTestId('end_timestamp').textContent).to.equal('Fri, 30 Oct 2026 12:00:04');
      expect(within(details).getByTestId('execution_time').textContent).to.equal('5s');
      expect(details.textContent).to.include('deploy-42');
      expect(within(details).getByText('examples.webhook').getAttribute('href')).to.equal('#/rules/examples.webhook/general');
      expect(details.textContent).to.include('Runs on every webhook');
      expect(within(details).getByText('core.st2.webhook').getAttribute('href')).to.equal('#/triggers/core.st2.webhook');
      expect(within(details).getByTestId('action_output').textContent).to.include('Fri Oct 30 12:00:00 UTC 2026');
      expect(within(details).getByText('check live output').getAttribute('href')).to.equal('#/code/live/e1');

      const input = within(details).getByTestId('action_input');
      expect(input.querySelector('[data-test="field:name"]').value).to.equal('Stanley');
      expect(input.querySelector('[data-test="field:cmd"]').disabled).to.be.true;
      expect(document.title).to.equal('examples.orquesta-sequential - History | My App Title');
    });

    it('switches the times to UTC when one is clicked', async () => {
      await act(async () => renderAt('/history/e1'));
      const started = await screen.findByTestId('start_timestamp');

      await act(async () => fireEvent.click(started));

      expect(screen.getByTestId('start_timestamp').textContent).to.equal('Fri, 30 Oct 2026 12:00:00 UTC');
      expect(screen.getByTestId('end_timestamp').textContent).to.equal('Fri, 30 Oct 2026 12:00:04 UTC');
      expect(screen.getByTestId('execution execution:e1').querySelector('time').textContent).to.equal('12:00:00 UTC');
    });

    it('switches to the code section', async () => {
      await act(async () => renderAt('/history/e1'));
      await screen.findByTestId('execution_id');

      await act(async () => fireEvent.click(screen.getByTestId('switch:code')));

      expect(location().pathname).to.equal('/history/e1/code');
      expect((await screen.findByTestId('execution_code')).textContent).to.include('"return_code": 0');
      expect(screen.queryByTestId('action_input')).to.be.null;
    });

    it('reruns the execution with the edited input and opens the new one', async () => {
      const rerun = full(listed('e5', 'scheduled', 16));
      mock.onPost(`${API}/executions/e1/re_run`).reply(201, rerun);
      mock.onGet(detailUrl('e5')).reply(200, rerun);

      await act(async () => renderAt('/history/e1'));
      await screen.findByTestId('execution_id');

      await act(async () => fireEvent.click(screen.getByTestId('rerun_button')));
      expect(location().pathname).to.equal('/history/e1/rerun');

      const popup = await screen.findByTestId('rerun_popup');
      fireEvent.change(popup.querySelector('[data-test="field:name"]'), { target: { value: 'Bob' }});
      await act(async () => fireEvent.click(within(popup).getByTestId('rerun_submit')));

      await waitFor(() => expect(mock.history.post).to.have.length(1));
      const [ request ] = mock.history.post;
      expect(request.params).to.deep.equal({ no_merge: true });
      expect(JSON.parse(request.data)).to.deep.equal({ parameters: { name: 'Bob' }});

      await waitFor(() => expect(location().pathname).to.equal('/history/e5'));
      expect(notification.success.calledWith('Execution of action "core.local" has been rerun successfully.')).to.be.true;
      await waitFor(() => expect(screen.getByTestId('execution_id').textContent).to.equal('e5'));
      expect(screen.queryByTestId('rerun_popup')).to.be.null;
    });

    it('closes the rerun popup on cancel', async () => {
      await act(async () => renderAt('/history/e1/rerun'));
      await screen.findByTestId('rerun_popup');

      await act(async () => fireEvent.click(screen.getByTestId('rerun_cancel')));

      expect(location().pathname).to.equal('/history/e1');
      expect(screen.queryByTestId('rerun_popup')).to.be.null;
      expect(mock.history.post).to.have.length(0);
    });

    it('reports a failed rerun', async () => {
      mock.onPost(`${API}/executions/e1/re_run`).reply(400, { faultstring: 'nope' });

      await act(async () => renderAt('/history/e1/rerun'));
      const popup = await screen.findByTestId('rerun_popup');

      await act(async () => fireEvent.click(within(popup).getByTestId('rerun_submit')));

      await waitFor(() => expect(notification.error.calledWith('Unable to rerun execution "e1".')).to.be.true);
      expect(notification.success.called).to.be.false;
      expect(location().pathname).to.equal('/history/e1/rerun');
    });

    it('cancels a running execution', async () => {
      mock.onDelete(`${API}/executions/e2`).reply(200, { ...full(newest), status: 'canceling' });

      await act(async () => renderAt('/history/e2'));
      await screen.findByTestId('execution_id');

      const cancel = screen.getByDisplayValue('Cancel');
      expect(cancel.disabled).to.be.false;
      await act(async () => fireEvent.click(cancel));

      await waitFor(() => expect(mock.history.delete).to.have.length(1));
      expect(mock.history.delete[0].url).to.equal(`${API}/executions/e2`);
      await waitFor(() => expect(notification.success.calledWith('Execution "core.local" has been canceled successfully.')).to.be.true);
    });

    it('reports a failed cancel', async () => {
      mock.onDelete(`${API}/executions/e2`).reply(409, { faultstring: 'already done' });

      await act(async () => renderAt('/history/e2'));
      await screen.findByTestId('execution_id');

      await act(async () => fireEvent.click(screen.getByDisplayValue('Cancel')));

      await waitFor(() => expect(notification.error.calledWith('Unable to cancel execution "e2".')).to.be.true);
    });

    it('only offers cancel while the execution is running', async () => {
      await act(async () => renderAt('/history/e1'));
      await screen.findByTestId('execution_id');

      expect(screen.getByDisplayValue('Cancel').disabled).to.be.true;
    });
  });
});
