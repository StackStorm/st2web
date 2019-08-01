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

import { expect } from 'chai';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import '@stackstorm/module-test-utils/bootstrap/storage';
import '@stackstorm/module-test-utils/bootstrap/location';
import api, { API } from '..';

import moxios from 'moxios';

process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection:', reason); // eslint-disable-line no-console
});

describe('API', () => {
  describe('inherits host from window', () => {
    const host = window.location.host; // capture initial value
    window.location.host = 'www.example.net:1234'; // set test value

    const api = new API();
    api.connect();

    expect(api.server.api).to.equal('https://www.example.net:1234/api'); // always

    window.location.host = host; // restore initial value
  });

  describe('can work with http', () => {
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
    before(() => moxios.install());
    after(() => moxios.uninstall());

    it('authenticates', () => {
      moxios.stubRequest('https://example.com/auth/tokens', {
        status: 201,
        response: {
          user: 'st2admin',
          token: 'foo',
          expiry: '2100-01-01T00:00:00.000Z',
        },
      });

      return api.connect({ auth: true }, 'username', 'password');
    });

    it('has opts and token', () => {
      expect(api.server).to.exist;
      expect(api.token).to.exist;
    });

    it('is connected', () => {
      expect(api.isConnected()).to.equal(true);
    });
  });

  describe('disconnect', () => {
    before(() => api.disconnect());

    it('doesn\'t have opts or token', () => {
      expect(api.server).to.not.exist;
      expect(api.token).to.not.exist;
    });

    it('is not connected', () => {
      expect(api.isConnected()).to.equal(false);
    });
  });
});
