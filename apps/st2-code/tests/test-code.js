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

import { Provider } from 'react-redux';
import { render, screen, act, waitFor } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from '@stackstorm/module-api';
import rootStore from '@stackstorm/module-store';
import router from '@stackstorm/module-router/methods';

import Code from '../code.component';

const API = 'https://example.com/api/v1';

// Stands in for the execution output stream; `emit` delivers an event the way EventSource would.
class FakeEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.closed = false;
    FakeEventSource.instances.push(this);
  }

  addEventListener(name, listener) {
    this.listeners[name] = [ ...this.listeners[name] || [], listener ];
  }

  removeEventListener() {}

  close() {
    this.closed = true;
  }

  emit(name, data) {
    (this.listeners[name] || []).forEach(listener => listener({ data: JSON.stringify(data) }));
  }
}

const back = () => screen.getByText('Back').getAttribute('href');
const code = () => document.querySelector('pre code').textContent;

describe('code app', () => {
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
    FakeEventSource.instances = [];
  });

  async function show(pathname) {
    let result;
    await act(async () => {
      router.push({ pathname });
      result = render(
        <Provider store={rootStore}>
          <Code />
        </Provider>
      );
    });
    return result;
  }

  describe('definitions', () => {
    const cases = [
      [ 'action', '/actions/views/overview/core.local', '/actions/core.local/code' ],
      [ 'execution', '/executions/core.local', '/history/core.local/code' ],
      [ 'rule', '/rules/views/core.local', '/rules/core.local/code' ],
      [ 'trigger_type', '/triggertypes/core.local', '/triggers/core.local/code' ],
    ];

    cases.forEach(([ type, path, backUrl ]) => {
      it(`shows the ${type} as JSON, linking back to it`, async () => {
        mock.onGet(`${API}${path}`).reply(200, { ref: 'core.local', type });

        await show(`/code/${type}/core.local`);

        await waitFor(() => expect(JSON.parse(code())).to.deep.equal({ ref: 'core.local', type }));
        expect(back()).to.equal(`#${backUrl}`);
      });

      it(`shows why the ${type} could not be loaded`, async () => {
        mock.onGet(`${API}${path}`).reply(404, { faultstring: `No ${type} with ref core.local` });

        await show(`/code/${type}/core.local`);

        await waitFor(() => expect(code()).to.equal(`No ${type} with ref core.local`));
        expect(back()).to.equal(`#${backUrl}`);
      });
    });

    it('links a trigger instance back to the instances of its trigger', async () => {
      mock.onGet(`${API}/triggerinstances/5f00`).reply(200, { id: '5f00', trigger: 'core.st2.webhook' });

      await show('/code/trigger_instance/5f00');

      await waitFor(() => expect(JSON.parse(code())).to.deep.equal({ id: '5f00', trigger: 'core.st2.webhook' }));
      expect(back()).to.equal('#/triggers/core.st2.webhook/instances');
    });

    it('links a missing trigger instance back to history', async () => {
      mock.onGet(`${API}/triggerinstances/5f00`).reply(404, { faultstring: 'Not found' });

      await show('/code/trigger_instance/5f00');

      await waitFor(() => expect(code()).to.equal('Not found'));
      expect(back()).to.equal('#/history');
    });

    it('loads the next item when the URL changes', async () => {
      mock.onGet(`${API}/rules/views/core.one`).reply(200, { ref: 'core.one' });
      mock.onGet(`${API}/rules/views/core.two`).reply(200, { ref: 'core.two' });

      await show('/code/rule/core.one');
      await waitFor(() => expect(JSON.parse(code()).ref).to.equal('core.one'));

      await act(async () => {
        router.push({ pathname: '/code/rule/core.two' });
      });

      await waitFor(() => expect(JSON.parse(code()).ref).to.equal('core.two'));
      expect(back()).to.equal('#/rules/core.two/code');
    });
  });

  describe('entrypoint', () => {
    it('shows the source of the action', async () => {
      mock.onGet(`${API}/actions/views/entry_point/core.local`).reply(200, 'echo "hello"', { 'content-type': 'text/plain' });

      await show('/code/entrypoint/core.local');

      await waitFor(() => expect(code()).to.equal('echo "hello"'));
      expect(back()).to.equal('#/actions/core.local/entrypoint');
    });

    it('shows why the source could not be loaded', async () => {
      mock.onGet(`${API}/actions/views/entry_point/core.local`).reply(404, { faultstring: 'No entrypoint' });

      await show('/code/entrypoint/core.local');

      await waitFor(() => expect(code()).to.equal('No entrypoint'));
    });
  });

  describe('execution result', () => {
    it('shows only the result of the execution', async () => {
      mock.onGet(`${API}/executions/5f00`).reply(200, { id: '5f00', result: { stdout: 'hi' }});

      await show('/code/result/5f00');

      await waitFor(() => expect(JSON.parse(code())).to.deep.equal({ stdout: 'hi' }));
      expect(mock.history.get[0].params).to.deep.equal({ include_attributes: 'result' });
      expect(back()).to.equal('#/history/5f00/general');
    });

    it('says so when there is no result', async () => {
      mock.onGet(`${API}/executions/5f00`).reply(200, { id: '5f00' });

      await show('/code/result/5f00');

      await waitFor(() => expect(code()).to.equal('// Action produced no data'));
    });
  });

  describe('live output', () => {
    it('follows the output of the execution on the stream', async () => {
      const { unmount } = await show('/code/live/5f00');

      await waitFor(() => expect(screen.getByText('The execution is yet to produce any live output')).to.exist);
      const [ stream ] = FakeEventSource.instances;
      expect(stream.url).to.equal('https://example.com/stream/executions/5f00/output');
      expect(back()).to.equal('#/history/5f00/general');

      // each message arrives in a task of its own
      act(() => stream.emit('st2.execution.output__create', { data: 'line one\n' }));
      act(() => stream.emit('st2.execution.output__create', { data: 'line two\n' }));

      expect(code()).to.equal('line one\nline two');
      expect(screen.queryByText('The execution is yet to produce any live output')).to.be.null;

      stream.emit('EOF', {});
      expect(stream.closed).to.be.true;

      stream.closed = false;
      unmount();
      expect(stream.closed).to.be.true;
    });

    describe('without a stream URL', () => {
      let server;

      beforeEach(() => {
        server = api.server;
        api.server = { ...server, stream: undefined };
      });

      afterEach(() => {
        api.server = server;
      });

      it('shows the output so far and explains how to see it live', async () => {
        mock.onGet(`${API}/executions/5f00/output`).reply(200, 'line one\n', { 'content-type': 'text/plain' });

        await show('/code/live/5f00');

        await waitFor(() => expect(code()).to.equal('line one'));
        expect(screen.getByText('need to explicitlty specify Stream URL', { exact: false })).to.exist;
        expect(FakeEventSource.instances).to.deep.equal([]);
      });

      it('says so when there is no output yet', async () => {
        mock.onGet(`${API}/executions/5f00/output`).reply(200, '', { 'content-type': 'text/plain' });

        await show('/code/live/5f00');

        await waitFor(() => expect(code()).to.equal('// Action produced no output'));
      });
    });
  });

  it('explains a type of code it does not know', async () => {
    await show('/code/workflow/core.local');

    await waitFor(() => expect(screen.getByText('Unknown type of code: workflow')).to.exist);
    expect(document.querySelector('pre')).to.be.null;
    expect(back()).to.equal('#/history');
    expect(mock.history.get).to.deep.equal([]);
  });

  it('renders nothing outside of its route', async () => {
    const { container } = await show('/actions/core.local');

    expect(container.innerHTML).to.equal('');
  });
});
