import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

global.window = {
  st2constants: { st2Config: {} },
};
global.localStorage = { removeItem: () => {} };
const api = require('@stackstorm/module-api').default; // using `require` so that globals run first
api.token = { user: 'Username' };
api.server = { name: 'Server' };

const Menu = require('..').default;

describe(`${Menu.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Menu
          className="foobar"
          routes={[]}
          location={{ pathname: 'pathname' }}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Menu
          foo="bar"
          routes={[]}
          location={{ pathname: 'pathname' }}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
