import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import Login from '..';

describe(`${Login.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Login
          className="foobar"
          onConnect={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Login
          foo="bar"
          onConnect={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
