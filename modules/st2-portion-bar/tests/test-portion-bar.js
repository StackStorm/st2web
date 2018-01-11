import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import PortionBar from '..';

describe(`${PortionBar.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <PortionBar
          className="foobar"
          content={{}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <PortionBar
          foo="bar"
          content={{}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
