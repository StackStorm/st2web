import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import Criteria from '..';

describe(`${Criteria.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Criteria
          className="foobar"
          onChange={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Criteria
          foo="bar"
          onChange={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
