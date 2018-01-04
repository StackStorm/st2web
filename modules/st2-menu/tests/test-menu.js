import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import '@stackstorm/module-test-utils/bootstrap/st2constants';
import api from '@stackstorm/module-api';
api.token = { user: 'Username' };
api.server = { name: 'Server' };

import Menu from '..';

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
