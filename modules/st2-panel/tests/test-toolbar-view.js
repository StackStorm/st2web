import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { ToolbarView } from '..';

describe(`${ToolbarView.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <ToolbarView
          className="foobar"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <ToolbarView
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
