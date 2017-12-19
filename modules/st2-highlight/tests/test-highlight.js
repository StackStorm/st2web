import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import Highlight from '..';

describe(`${Highlight.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Highlight
          className="foobar"
          code="code"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Highlight
          foo="bar"
          code="code"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
