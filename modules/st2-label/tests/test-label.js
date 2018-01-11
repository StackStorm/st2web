import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import Label from '..';

describe(`${Label.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Label
          className="foobar"
          status="enabled"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Label
          foo="bar"
          status="enabled"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
