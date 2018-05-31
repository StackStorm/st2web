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
