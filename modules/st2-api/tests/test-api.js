// Copyright 2019 Extreme Networks, Inc.
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

import { describe, it, beforeAll, afterAll } from '@rstest/core';
import { expect } from 'chai';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/storage';
import '@stackstorm/module-test-utils/bootstrap/location';
import api, { API } from '..';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection:', reason); // eslint-disable-line no-console
});

describe('API', () => {
  it('inherits host from window', () => {
    const host = window.location.host; // capture initial value
    window.location.host = 'www.example.net:1234'; // set test value

    const api = new API();
    api.connect();

    expect(api.server.api).to.equal('https://www.example.net:1234/api'); // always

    window.location.host = host; // restore initial value
  });

  it('can work with http', () => {
    // capture initial value
    const host = window.location.host;
    const protocol = window.location.protocol;

    // set test value
    window.location.host = 'www.example.net:1234';
    window.location.protocol = 'http:';

    const api = new API();
    api.connect();

    expect(api.server.api).to.equal('http://www.example.net:1234/api');
    expect(api.server.auth).to.equal('http://www.example.net:1234/auth');
    expect(api.server.stream).to.equal('http://www.example.net:1234/stream');

    // restore initial value
    window.location.host = host;
    window.location.protocol = protocol;
  });

  describe('connect', () => {
    let mock;

    beforeAll(() => {
      mock = new MockAdapter(axios);
    });
    afterAll(() => mock.restore());

    it('authenticates', async () => {
      mock.onPost('https://example.com/auth/tokens').reply(201, {
        user: 'st2admin',
        token: 'foo',
        expiry: '2100-01-01T00:00:00.000Z',
      });

      await api.connect({ auth: true }, 'username', 'password');

      expect(mock.history.post[0].headers.Authorization).to.equal(`Basic ${btoa('username:password')}`);
    });

    it('has opts and token', () => {
      expect(api.server).to.exist;
      expect(api.token).to.exist;
    });

    it('is connected', () => {
      expect(api.isConnected()).to.equal(true);
    });
  });

  describe('request', () => {
    let mock;

    beforeAll(() => {
      mock = new MockAdapter(axios);
    });
    afterAll(() => mock.restore());

    it('sends list filters as comma-separated values and skips empty ones', async () => {
      mock.onGet('https://example.com/api/v1/executions').reply(200, [], { 'content-type': 'application/json' });

      await api.request({ path: '/executions', query: { status: [ 'failed', 'canceled' ], limit: 5, action: undefined }});

      const req = mock.history.get[0];
      expect(axios.getUri(req)).to.equal('https://example.com/api/v1/executions?status=failed,canceled&limit=5');
      expect(req.headers['x-auth-token']).to.equal('foo');
    });

    it('parses JSON bodies and exposes the request id on raw responses', async () => {
      mock.onGet('https://example.com/api/v1/actions').reply(200, '{"ref":"core.local"}', {
        'content-type': 'application/json',
        'x-request-id': 'abc-123',
      });

      const res = await api.request({ path: '/actions', raw: true });

      expect(res.body).to.deep.equal({ ref: 'core.local' });
      expect(res.statusCode).to.equal(200);
      expect(res.requestId).to.equal('abc-123');
    });

    it('rejects on error statuses', async () => {
      mock.onGet('https://example.com/api/v1/rules').reply(404, { faultstring: 'nope' });

      const err = await api.request({ path: '/rules' }).then(() => null, e => e);

      expect(err.response.status).to.equal(404);
      expect(err.response.data.faultstring).to.equal('nope');
    });
  });

  describe('disconnect', () => {
    beforeAll(() => api.disconnect());

    it('doesn\'t have opts or token', () => {
      expect(api.server).to.not.exist;
      expect(api.token).to.not.exist;
    });

    it('is not connected', () => {
      expect(api.isConnected()).to.equal(false);
    });
  });
});
