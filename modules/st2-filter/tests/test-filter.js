import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import Filter from '..';

describe(`${Filter.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Filter
          className="foobar"
          items={[]}
          activeItems={[]}
          label="label"
          onChange={() => {}}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Filter
          foo="bar"
          items={[]}
          activeItems={[]}
          label="label"
          onChange={() => {}}
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
