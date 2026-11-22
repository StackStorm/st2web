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
import flexStyle from '@stackstorm/module-flex-table/style.module.css';
import formStyle from '@stackstorm/module-forms/style.module.css';

import store from '../store';
import InquiryPanel from '../inquiry-panel.component';

const API = 'https://example.com/api/v1';

const execution = (id, status, result = {}) => ({
  id,
  status,
  runner: { name: 'inquirer' },
  context: {},
  result: {
    schema: {
      type: 'object',
      properties: {
        approved: { type: 'boolean', required: true },
        comment: { type: 'string' },
      },
    },
    roles: [],
    users: [],
    route: '',
    ttl: 1440,
    ...result,
  },
});

const pending = execution('aaa1', 'pending');
const answered = execution('bbb2', 'succeeded', { response: { approved: true }});

// What inquiry.component.js renders, minus the menu: the route feeds location and match from
// the root store, the panel reads its data from the scoped store.
function renderAt(pathname, search = '') {
  updateLocation({ pathname, search, hash: '' }, 'PUSH');

  return render(
    <Provider store={rootStore}>
      <Route
        path="/inquiry/:ref?/:section?"
        render={({ match, location }) => (
          <Provider store={store}>
            <InquiryPanel location={location} match={match} />
          </Provider>
        )}
      />
    </Provider>
  );
}

const location = () => rootStore.getState().location;

describe('InquiryPanel', () => {
  let mock;

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
    mock = new MockAdapter(axios);
    sinon.stub(notification, 'success');
    sinon.stub(notification, 'error');

    // drop what earlier tests left in the shared store
    await store.dispatch({ type: 'FETCH_INQUIRIES', promise: Promise.resolve([]) });
    await store.dispatch({ type: 'FETCH_INQUIRY', promise: Promise.resolve(undefined) });
  });
  afterEach(() => {
    mock.restore();
    sinon.restore();
  });

  const listRequests = () => mock.history.get.filter(({ url }) => url === `${API}/executions`);

  function replyList(list, headers = {}) {
    mock.onGet(`${API}/executions`).reply(200, list, { 'x-total-count': `${list.length}`, 'x-limit': '50', ...headers });
  }

  describe('list', () => {
    it('asks for inquirer executions and groups them by status', async () => {
      replyList([ pending, answered ]);

      await act(async () => renderAt('/inquiry'));

      const panel = await screen.findByTestId('inquiry_panel');
      await waitFor(() => expect(panel.querySelectorAll('.st2-flex-table')).to.have.length(2));

      const [ request ] = listRequests();
      expect(request.params).to.deep.equal({ runner: 'inquirer', limit: 50, offset: 0 });

      const [ pendingTable, answeredTable ] = panel.querySelectorAll('.st2-flex-table');
      expect(pendingTable.querySelector('.st2-flex-table__caption-title').textContent).to.equal('pending');
      expect(within(pendingTable).getByTestId('inquiry inquiry:aaa1')).to.exist;
      expect(answeredTable.querySelector('.st2-flex-table__caption-title').textContent).to.equal('succeeded');
      expect(within(answeredTable).getByTestId('inquiry inquiry:bbb2')).to.exist;
    });

    it('shows an empty state when there are no inquiries', async () => {
      replyList([]);

      await act(async () => renderAt('/inquiry'));

      await waitFor(() => expect(document.querySelector('.st2-panel__content-empty')).to.not.be.null);
      expect(document.querySelectorAll('.st2-flex-table')).to.have.length(0);
    });

    it('reports a failed fetch', async () => {
      mock.onGet(`${API}/executions`).reply(500, { faultstring: 'down' });

      await act(async () => renderAt('/inquiry'));

      await waitFor(() => expect(notification.error.calledWith('Unable to retrieve inquiries.')).to.be.true);
    });

    it('collapses and expands every table at once', async () => {
      replyList([ pending, answered ]);

      await act(async () => renderAt('/inquiry'));
      await screen.findByTestId('inquiry inquiry:aaa1');

      fireEvent.click(screen.getByTestId('toggle-all'));
      expect(screen.queryByTestId('inquiry inquiry:aaa1')).to.be.null;
      expect(screen.queryByTestId('inquiry inquiry:bbb2')).to.be.null;

      fireEvent.click(screen.getByTestId('toggle-all'));
      expect(screen.getByTestId('inquiry inquiry:aaa1')).to.exist;
    });
  });

  describe('pagination', () => {
    it('pages through older inquiries', async () => {
      replyList([ pending ], { 'x-total-count': '120' });

      await act(async () => renderAt('/inquiry'));
      await screen.findByTestId('inquiry inquiry:aaa1');

      const newer = screen.getByDisplayValue('Newer');
      const older = screen.getByDisplayValue('Older');
      expect(newer.classList.contains(formStyle.disabled)).to.be.true;
      expect(older.classList.contains(formStyle.disabled)).to.be.false;

      await act(async () => fireEvent.click(older));

      expect(location().search).to.equal('?page=2');
      await waitFor(() => expect(listRequests()).to.have.length(2));
      expect(listRequests()[1].params.offset).to.equal(50);
    });

    it('disables "Older" on the last page', async () => {
      replyList([ pending ], { 'x-total-count': '120' });

      await act(async () => renderAt('/inquiry', '?page=3'));
      await screen.findByTestId('inquiry inquiry:aaa1');

      expect(listRequests()[0].params.offset).to.equal(100);
      expect(screen.getByDisplayValue('Older').classList.contains(formStyle.disabled)).to.be.true;
      expect(screen.getByDisplayValue('Newer').classList.contains(formStyle.disabled)).to.be.false;
    });
  });

  describe('details', () => {
    it('opens the inquiry that is clicked', async () => {
      replyList([ pending, answered ]);
      mock.onGet(`${API}/executions/bbb2`).reply(200, answered);

      await act(async () => renderAt('/inquiry'));
      expect(screen.queryByTestId('details')).to.be.null;

      await act(async () => fireEvent.click(await screen.findByTestId('inquiry inquiry:bbb2')));

      expect(location().pathname).to.equal('/inquiry/bbb2');
      const details = await screen.findByTestId('details');
      expect(within(details).getByTestId('header_name').textContent).to.equal('bbb2');
      expect(screen.getByTestId('inquiry inquiry:bbb2').classList.contains(flexStyle.active)).to.be.true;
      expect(screen.getByTestId('inquiry inquiry:aaa1').classList.contains(flexStyle.active)).to.be.false;
    });

    it('shows a form for the inquiry schema, filled with the earlier response', async () => {
      replyList([ answered ]);
      mock.onGet(`${API}/executions/bbb2`).reply(200, answered);

      await act(async () => renderAt('/inquiry/bbb2'));

      const form = await screen.findByTestId('inquiry_parameters');
      await waitFor(() => expect(within(form).getByRole('checkbox').checked).to.be.true);
      expect(within(form).getByTestId('field:comment').value).to.equal('');
      expect(document.title).to.equal('bbb2 - History | My App Title');
    });

    it('switches to the code section', async () => {
      replyList([ pending ]);
      mock.onGet(`${API}/executions/aaa1`).reply(200, pending);

      await act(async () => renderAt('/inquiry/aaa1'));
      await screen.findByTestId('details');

      await act(async () => fireEvent.click(screen.getByTestId('switch:code')));

      expect(location().pathname).to.equal('/inquiry/aaa1/code');
      const code = await screen.findByTestId('inquiry_code');
      expect(code.textContent).to.include('"ttl": 1440');
      expect(screen.queryByTestId('inquiry_parameters')).to.be.null;
    });

    it('previews the response before it is sent', async () => {
      replyList([ pending ]);
      mock.onGet(`${API}/executions/aaa1`).reply(200, pending);

      await act(async () => renderAt('/inquiry/aaa1'));
      const form = await screen.findByTestId('inquiry_parameters');

      fireEvent.change(within(form).getByTestId('field:comment'), { target: { value: 'ship it' }});
      fireEvent.click(screen.getByDisplayValue('Preview'));

      expect(screen.getByTestId('response_preview').textContent).to.include('"comment": "ship it"');

      fireEvent.click(screen.getByDisplayValue('Preview'));
      expect(screen.queryByTestId('response_preview')).to.be.null;
    });

    it('sends the response to the API', async () => {
      replyList([ pending ]);
      mock.onGet(`${API}/executions/aaa1`).reply(200, pending);
      mock.onPut(`${API}/inquiries/aaa1`).reply(200, { id: 'aaa1', response: { approved: true, comment: 'ship it' }});

      await act(async () => renderAt('/inquiry/aaa1'));
      const form = await screen.findByTestId('inquiry_parameters');

      fireEvent.click(within(form).getByRole('checkbox'));
      fireEvent.change(within(form).getByTestId('field:comment'), { target: { value: 'ship it' }});
      await act(async () => fireEvent.click(screen.getByTestId('run_response')));

      await waitFor(() => expect(mock.history.put).to.have.length(1));
      const body = JSON.parse(mock.history.put[0].data);
      expect(body.id).to.equal('aaa1');
      expect(body.response).to.deep.equal({ approved: true, comment: 'ship it' });

      await waitFor(() => expect(notification.success.calledWith('Inquiry "aaa1" has been responded successfully.')).to.be.true);
      expect(store.getState().inquiry.response).to.deep.equal({ approved: true, comment: 'ship it' });
    });

    it('reports a rejected response', async () => {
      replyList([ pending ]);
      mock.onGet(`${API}/executions/aaa1`).reply(200, pending);
      mock.onPut(`${API}/inquiries/aaa1`).reply(400, { faultstring: 'not allowed' });

      await act(async () => renderAt('/inquiry/aaa1'));
      await screen.findByTestId('inquiry_parameters');

      await act(async () => fireEvent.click(screen.getByTestId('run_response')));

      await waitFor(() => expect(notification.error.calledWith('Unable to respond to inquiry "aaa1".')).to.be.true);
      expect(notification.success.called).to.be.false;
      expect(store.getState().inquiry.response).to.be.undefined;
    });
  });
});
