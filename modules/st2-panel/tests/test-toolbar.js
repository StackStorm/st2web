import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { Toolbar } from '..';

describe(`${Toolbar.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Toolbar
          className="foobar"
          title="Title"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Toolbar
          foo="bar"
          title="Title"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
