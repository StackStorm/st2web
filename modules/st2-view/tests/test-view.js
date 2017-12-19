import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

global.sessionStorage = {
  getItem: (name) => JSON.stringify({}),
  setItem: (name, data) => {},
};
const View = require('..').default; // using `require` so that globals run first

describe(`${View.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <View
          className="foobar"
          name="name"
          spec={{}}
          onChange={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <View
          foo="bar"
          name="name"
          spec={{}}
          onChange={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
