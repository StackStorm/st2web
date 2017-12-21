import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import { DetailsPanelEmpty } from '..';

describe(`${DetailsPanelEmpty.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <DetailsPanelEmpty
          className="foobar"
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <DetailsPanelEmpty
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });
});
