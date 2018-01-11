import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { FlexTableInsert } from '..';

describe(`${FlexTableInsert.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <FlexTableInsert
          className="foobar"
          code="code"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <FlexTableInsert
          foo="bar"
          code="code"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
